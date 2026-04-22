export default function Page({ searchParams }) {
  return <div dangerouslySetInnerHTML={{ __html: searchParams.html }} />
}
