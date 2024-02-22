import { Spacer } from "../components/layout";

export function SectionTestimonial() {
  return (
    <section className="bg-[#144B44] py-32 m-4 rounded-2xl">
      <div className="max-w-screen-xl px-16 md:px-32">
        <QuoteIcon />
        <div className="text-[84px] leading-[71px] -tracking-[3px] font-medium text-white pt-[49px]">
          There are these apps that just feel good to use but you can&apos;t
          exactly describe why. Daimo is one of those.
        </div>
        <Spacer h={24} />
        <div className="text-2xl tracking-[1px] font-medium text-white">
          Kristof Gazso
        </div>
        <Spacer h={8} />
        <p className="text-2xl tracking-[1px] font-medium text-[#aaa]">
          ERC-4337 coauthor, founder of{" "}
          <a href="https://pimlico.io" target="blank" className="underline">
            Pimlico
          </a>
        </p>
      </div>
    </section>
  );
}

function QuoteIcon() {
  return (
    <svg
      width="71"
      height="65"
      viewBox="0 0 71 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M28.0494 65H0V37.0179C0 28.4679 1.94787 20.9865 5.84362 14.574C9.73937 7.96711 17.1413 3.10911 28.0494 0V14.574C22.9849 16.3229 19.3813 18.7519 17.2387 21.861C15.2908 24.9701 14.4143 30.0224 14.6091 37.0179H28.0494V65ZM71 65H42.9506V37.0179C42.9506 28.4679 44.8985 20.9865 48.7942 14.574C52.69 7.96711 60.0919 3.10911 71 0V14.574C65.9355 16.3229 62.332 18.7519 60.1893 21.861C58.2414 24.9701 57.3649 30.0224 57.5597 37.0179H71V65Z"
        fill="white"
      />
    </svg>
  );
}
