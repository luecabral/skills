import type { CategoryResult, CheckContext, CheckItem } from '../types.js';
import { parseTypeScript } from '../ast.js';
import { globFiles } from '../utils.js';
import { Node, type Expression } from 'ts-morph';

interface RouteAuthResult {
  file: string;
  authCalls: number;
}

function getCallName(expression: Expression): string {
  if (Node.isIdentifier(expression)) return expression.getText();
  if (Node.isPropertyAccessExpression(expression)) return expression.getName();
  return '';
}

async function countAuthCalls(file: string, context?: CheckContext): Promise<RouteAuthResult> {
  const sourceFile = await parseTypeScript(file, context);
  const authCallNames = new Set([
    'auth',
    'getUser',
    'getSession',
    'verifyToken',
    'checkPermission',
    'requireAuth',
    'withAuth',
    'authenticatedUser',
  ]);
  let authCalls = 0;

  sourceFile?.forEachDescendant((node) => {
    if (!Node.isCallExpression(node)) return;
    const callName = getCallName(node.getExpression());
    if (authCallNames.has(callName)) {
      authCalls++;
    }
  });

  return { file, authCalls };
}

export async function check(projectRoot: string, context?: CheckContext): Promise<CategoryResult> {
  const routeFiles = await globFiles(projectRoot, [
    'app/api/**/*.ts',
    'app/api/**/*.tsx',
    'app/api/**/*.js',
    'app/api/**/*.jsx',
    'pages/api/**/*.ts',
    'pages/api/**/*.js',
    'src/app/api/**/*.ts',
    'src/app/api/**/*.js',
    'src/pages/api/**/*.ts',
    'src/pages/api/**/*.js',
  ], context);
  const routeResults = await Promise.all(routeFiles.map((file) => countAuthCalls(file, context)));
  const routesWithAuth = routeResults.filter((result) => result.authCalls > 0);
  const routesWithoutAuth = routeResults.filter((result) => result.authCalls === 0);
  const authCallCount = routeResults.reduce((sum, result) => sum + result.authCalls, 0);

  const items: CheckItem[] = [
    {
      id: 'A5',
      description: 'Autorização por role antes de qualquer operação',
      status: routeFiles.length === 0 ? 'warn' : routesWithoutAuth.length > 0 ? 'fail' : 'pass',
      severity: 'critical',
      detail:
        routeFiles.length === 0
          ? 'Nenhum route handler encontrado'
          : routesWithoutAuth.length > 0
            ? `${routesWithoutAuth.length} route(s) sem chamada real de auth; ${authCallCount} chamada(s) de auth em ${routeFiles.length} route(s)`
            : `${routesWithAuth.length}/${routeFiles.length} route(s) com chamada real de auth`,
      file: routesWithoutAuth[0]?.file,
      remediation: 'Verifique autenticação/autorização no início de cada route handler',
    },
  ];

  return {
    id: 'A',
    name: 'Route Authorization',
    items,
  };
}
