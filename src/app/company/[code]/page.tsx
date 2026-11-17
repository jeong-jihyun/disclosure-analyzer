import { CompanyView } from "@/components/CompanyView";

export default async function CompanyPage(props: PageProps<"/company/[code]">) {
  const { code } = await props.params;
  return <CompanyView key={code} code={decodeURIComponent(code)} />;
}
