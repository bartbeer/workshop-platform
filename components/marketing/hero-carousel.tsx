"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { HeroSlide } from "@/lib/marketing/hero-slides";

type Props = {
  slides: HeroSlide[];
};

export function HeroCarousel({ slides }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const showSlide = useCallback((index: number) => {
    const next = ((index % slides.length) + slides.length) % slides.length;
    setCurrentSlide(next);
  }, [slides.length]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCurrentSlide((c) => (c + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <section className="bg-japandi-white relative z-[5] h-[85vh] w-full overflow-hidden">
      <div className="relative h-full w-full" id="hero-carousel">
        {slides.map((slide, index) => (
          <div
            key={slide.imageSrc}
            className={`carousel-item absolute inset-0 duration-1000 ${index === currentSlide ? "active" : ""}`}
          >
            <Image
              src={slide.imageSrc}
              alt={slide.imageAlt}
              fill
              priority={index === 0}
              className="object-cover grayscale"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/15" />
            <div className="absolute bottom-24 left-8 max-w-2xl text-white md:left-16 lg:left-32">
              <span className="font-label mb-4 block text-[10px] tracking-[0.3em] uppercase">
                {slide.kicker}
              </span>
              <h2 className="font-headline editorial-spacing mb-8 text-5xl leading-tight font-light md:text-7xl">
                {slide.title}
              </h2>
              <Link
                href={slide.ctaHref}
                className="font-label bg-japandi-blue inline-block px-8 py-4 text-[10px] tracking-widest text-white uppercase transition-all hover:opacity-90"
              >
                {slide.ctaLabel}
              </Link>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="absolute top-1/2 left-8 z-10 -translate-y-1/2 text-white/50 transition-colors hover:text-white"
        aria-label="Vorige slide"
        onClick={() => showSlide(currentSlide - 1)}
      >
        <span className="material-symbols-outlined text-4xl">west</span>
      </button>
      <button
        type="button"
        className="absolute top-1/2 right-8 z-10 -translate-y-1/2 text-white/50 transition-colors hover:text-white"
        aria-label="Volgende slide"
        onClick={() => showSlide(currentSlide + 1)}
      >
        <span className="material-symbols-outlined text-4xl">east</span>
      </button>
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 space-x-4">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Ga naar slide ${index + 1}`}
            className={`h-[2px] w-12 cursor-pointer transition-colors ${index === currentSlide ? "bg-white" : "bg-white/30"}`}
            onClick={() => showSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}
