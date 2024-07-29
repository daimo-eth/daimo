"use client";

import { Tab } from "@headlessui/react";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Fragment, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import { useI18N } from "../i18n/context";

export function SectionWhyDaimo() {
  return (
    <section id="features">
      <div className="block md:hidden">
        <FeaturesMobile />
      </div>
      <div className="hidden md:flex">
        <FeaturesDesktop />
      </div>
    </section>
  );
}

function FeaturesDesktop() {
  const i18n = useI18N();
  const i18 = i18n.homePage.whyDaimo;

  // moved this definition to i18n for easier transl
  const features = i18.features();

  const [selectedIndex, setSelectedIndex] = useState(0);

  const goToNextTab = () => {
    setSelectedIndex((currentIndex) => (currentIndex + 1) % features.length);
  };

  const goToPreviousTab = () => {
    setSelectedIndex(
      (currentIndex) => (currentIndex - 1 + features.length) % features.length
    );
  };

  const onChange = useDebouncedCallback(
    (selectedIndex) => {
      setSelectedIndex(selectedIndex);
    },
    100,
    { leading: true }
  );

  return (
    <Tab.Group
      as="div"
      selectedIndex={selectedIndex}
      onChange={onChange}
      className="w-full grid grid-cols-2 items-center justify-items-center"
    >
      <div className="flex flex-col flex-1 w-full justify-center items-center bg-[url('/assets/why-gradient.jpg')] bg-cover bg-no-repeat min-h-[80vh] py-24">
        <div>
          <h2 className="font-medium text-[32px] px-10 leading-tight md:text-[40px] lg:text-[65px] text-[#111111] pb-3">
            {i18.texts.whyDaimo()}
          </h2>
          <p className="font-normal text-left text-sm md:text-[18px] px-10 lg:text-[24px] text-[#535353] pb-8 leading-snug tracking-wide max-w-xl ">
            {i18.texts.text1()}
            <br></br>
            {i18.texts.text2()}
          </p>
        </div>
        <div className="flex flex-row justify-center items-center space-x-4 lg:space-x-10">
          <div
            onClick={goToPreviousTab}
            className="bg-[#144B44] w-12 h-12 flex justify-center items-center text-white rounded-full px-3 py-3 font-bold text-[18px] hover:bg-[#144B44] hover:text-white transition-colors cursor-pointer select-none"
          >
            &larr;
          </div>
          <Image
            src={features[selectedIndex].imageUrl}
            width={800}
            height={800}
            alt="Feature Image"
            className="w-[260px] "
          />
          <div
            onClick={goToNextTab}
            className="bg-[#144B44] w-12 h-12 flex justify-center items-center text-white rounded-full px-3 py-3 font-bold text-[18px] hover:bg-[#144B44] hover:text-white transition-colors cursor-pointer select-none"
          >
            &rarr;
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center max-w-md">
        <div className="relative w-auto h-full">
          <Image
            className="absolute top-[0px] left-[-100px] z-[-5]"
            width={800}
            height={800}
            alt="Pixel Background"
            src="/pixel-bg.svg"
          />
        </div>
        <div className="my-6 flex justify-center gap-6">
          {features.map((_, featureIndex) => (
            <button
              type="button"
              key={featureIndex}
              className={clsx(
                "relative h-2 w-2 rounded-full",
                featureIndex === selectedIndex
                  ? "bg-primaryDark"
                  : "bg-grayLight"
              )}
              aria-label={`Go to slide ${featureIndex + 1}`}
              onClick={() => {
                setSelectedIndex(featureIndex);
              }}
            ></button>
          ))}
        </div>
        <Tab.List className="border-b border-b-grayMid/40 py-4 flex flex-row justify-between z-50">
          {features.map((feature) => (
            <Tab as={Fragment} key={feature.name}>
              {({ selected }) => (
                <div
                  className={`text-center font-semibold text-[24px] cursor-pointer ${
                    selected ? "text-[#144B44]" : "text-[#AAAAAA]"
                  } transition-colors`}
                >
                  {feature.name}
                </div>
              )}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="min-h-[35vh]">
          <AnimatePresence initial={false}>
            {features.map((feature, featureIndex) => (
              <Tab.Panel
                key={feature.name}
                className={`${
                  selectedIndex === featureIndex ? "block" : "hidden"
                } p-8`}
              >
                {feature.comingSoon && (
                  <p className="py-2 text-base font-bold tracking-widest text-royalblue">
                    {i18.texts.commingSoon()}
                  </p>
                )}
                <h3 className="text-[38px] font-medium">{feature.title}</h3>
                {feature.description.map((description, i) => (
                  <p key={i} className="mt-2 text-xl text-[#777]">
                    {description}
                  </p>
                ))}
              </Tab.Panel>
            ))}
          </AnimatePresence>
        </Tab.Panels>
      </div>
    </Tab.Group>
  );
}

function FeaturesMobile() {
  const [activeIndex, setActiveIndex] = useState(0);
  const slideContainerRef = useRef<React.ElementRef<"div">>(null);
  const slideRefs = useRef<React.ElementRef<"div">[]>([]);

  const i18n = useI18N();
  const i18 = i18n.homePage.whyDaimo;

  // moved this definition to i18n for easier transl
  const features = i18.features();

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target instanceof HTMLDivElement) {
            setActiveIndex(slideRefs.current.indexOf(entry.target));
            break;
          }
        }
      },
      {
        root: slideContainerRef.current,
        threshold: 0.6,
      }
    );

    for (const slide of slideRefs.current) {
      if (slide) {
        observer.observe(slide);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [slideContainerRef, slideRefs]);

  return (
    <div className="flex flex-col pt-10 min-h-[90vh]">
      <h2 className="text-3xl font-medium px-6">{i18.texts.whyDaimo()}</h2>
      <p className="mt-4 text-grayMid pb-8 px-6">
        {i18.texts.text1()}
        {i18.texts.text2()}
      </p>
      <div className="my-6 flex justify-center gap-4">
        {features.map((_, featureIndex) => (
          <button
            type="button"
            key={featureIndex}
            className={clsx(
              "relative h-2 w-2 rounded-full",
              featureIndex === activeIndex ? "bg-primaryDark" : "bg-grayLight"
            )}
            aria-label={`Go to slide ${featureIndex + 1}`}
            onClick={() => {
              slideRefs.current[featureIndex].scrollIntoView({
                block: "nearest",
                inline: "nearest",
              });
            }}
          >
            <span className="absolute -inset-x-1.5 -inset-y-3" />
          </button>
        ))}
      </div>
      <div className="my-6 flex justify-between px-6 ">
        {features.map((feature, featureIndex) => (
          <button
            type="button"
            key={featureIndex}
            className={clsx(
              "relative font-semibold",
              featureIndex === activeIndex ? "text-primaryDark" : "text-grayMid"
            )}
            aria-label={`Go to slide ${featureIndex + 1}`}
            onClick={() => {
              slideRefs.current[featureIndex].scrollIntoView({
                block: "nearest",
                inline: "nearest",
              });
            }}
          >
            {feature.name}
          </button>
        ))}
      </div>
      <div
        ref={slideContainerRef}
        className="pt-12 flex snap-x snap-mandatory -space-x-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-12 [scrollbar-width:none] sm:-space-x-6 [&::-webkit-scrollbar]:hidden px-[-24px]  bg-[url('/assets/why-gradient.jpg')] bg-cover bg-no-repeat"
      >
        {features.map((feature, featureIndex) => (
          <div
            key={featureIndex}
            ref={(ref) => {
              if (ref) slideRefs.current[featureIndex] = ref;
            }}
            className="w-full flex-none snap-center px-4 sm:px-6"
          >
            <div className="relative transform overflow-hidden rounded-2xl ">
              <div className="px-6 backdrop-blur sm:p-10">
                <div className="mx-auto max-h-[60vh] overflow-hidden border-b border-midnight/40 mb-6">
                  <Image
                    src={feature.imageUrl}
                    width={800}
                    height={800}
                    alt="Feature Image"
                  />
                </div>
                {feature.comingSoon && (
                  <p className="py-1 text-xs text-royalblue">
                    {i18.texts.commingSoon()}
                  </p>
                )}
                <h3 className="text-3xl font-medium text-black sm:text-3xl">
                  {feature.title}
                </h3>
                <p className="mt-2 text-md text-[#777]">
                  {feature.description.join(" ")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
