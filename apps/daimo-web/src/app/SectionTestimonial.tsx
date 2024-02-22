import { Spacer } from "../components/layout";

export function SectionTestimonial() {
  return (
    <section className="bg-[#144B44] py-20 lg:py-32 lg:m-4 lg:rounded-2xl  relative  overflow-hidden">
      <div className="relative max-w-screen-xl px-16 md:px-32 z-10">
        <QuoteIcon />
        <div className="text-[40px] leading-[35px] lg:text-[84px] lg:leading-[71px] lg:-tracking-[3px] font-medium text-white pt-[49px]">
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
      <div className="absolute top-10 left-32 lg:right-10 lg:-bottom-4 lg:top-auto lg:left-auto overflow-clip z-0">
        <BackgroundAccent />
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

function BackgroundAccent() {
  return (
    <svg
      width="718"
      height="817"
      viewBox="0 0 718 817"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M716.041 2H263.235C118.959 2 2 118.959 2 263.235V624.609C2 754.457 107.263 859.72 237.111 859.72V859.72C366.959 859.72 472.222 754.457 472.222 624.609V428.683"
        className="stroke-[#aaa]/20"
        strokeWidth="3"
      />
      <path
        d="M2.00574 1060L454.812 1060C599.088 1060 716.047 943.041 716.047 798.765L716.047 437.391C716.047 307.543 610.784 202.28 480.936 202.28V202.28C351.088 202.28 245.825 307.543 245.825 437.391L245.825 633.317"
        className="stroke-[#aaa]/20"
        strokeWidth="3"
      />
    </svg>
  );
}
