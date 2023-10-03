import Image from "next/image";

import { Spacer } from "../components/layout";
import { SectionH3 } from "../components/typography";

export function SectionTeam() {
  return (
    <section className="bg-white py-24" id="team">
      <center className="m-auto w-[32rem]">
        <SectionH3>Meet the team</SectionH3>
        <Spacer h={48} />
        <div className="flex gap-12">
          <Person
            img="/assets/team-dc.png"
            name="DC Posch"
            title="Co-founder"
          />
          <Person
            img="/assets/team-nalin.png"
            name="Nalin Bhardwaj"
            title="Co-founder"
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
}: {
  img: string;
  name: string;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <Image src={img} width={270} height={270} alt={name} />
      <Spacer h={24} />
      <SectionH3>{name}</SectionH3>
      <Spacer h={12} />
      <div className="text-base text-grayMid">{title}</div>
    </div>
  );
}
