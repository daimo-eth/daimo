import Image from "next/image";

import { Spacer } from "../components/Spacer";
import { TextH1 } from "../components/typography";
import { useI18N } from "../i18n/context";

export function SectionTeam() {
  const i18n = useI18N();
  const i18 = i18n.homePage.team;

  return (
    <section className="bg-white py-24" id="team">
      <center className="m-auto w-[32rem]">
        <TextH1>{i18.meetTheTeam()}</TextH1>
        <Spacer h={48} />
        <div className="flex gap-12">
          <Person
            img="/assets/team-dc.png"
            name="DC Posch"
            title="Co-founder"
            links={[
              { title: "x", url: "https://x.com/dcposch" },
              { title: "fc", url: "https://warpcast.com/dcposch.eth" },
            ]}
          />
          <Person
            img="/assets/team-nalin.png"
            name="Nalin Bhardwaj"
            title="Co-founder"
            links={[
              { title: "x", url: "https://x.com/nibnalin" },
              { title: "web", url: "https://nibnalin.me/" },
            ]}
          />
        </div>
      </center>
    </section>
  );
}

function Person({
  img,
  name,
  title,
  links,
}: {
  img: string;
  name: string;
  title: string;
  links: { title: string; url: string }[];
}) {
  return (
    <div className="flex flex-col items-center">
      <Image src={img} width={270} height={270} alt={name} />
      <Spacer h={24} />
      <TextH1>{name}</TextH1>
      <Spacer h={12} />
      <div className="text-base text-grayMid">{title}</div>
      <Spacer h={12} />
      <div className="text-base text-grayMid">
        {links.map((link, i) => (
          <>
            <a key={i} href={link.url} target="_blank" className="underline">
              {link.title}
            </a>
            {i < links.length - 1 && ", "}
          </>
        ))}
      </div>
    </div>
  );
}
