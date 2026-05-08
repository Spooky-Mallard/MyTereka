"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

const slides = [
  {
    heading: "Welcome to Expense Manager",
    image: "/onboard-a.png",
    imageAlt: "Hand holding money illustration",
  },
  {
    heading: "Are you ready to take control of your finances?",
    image: "/onboard-b.png",
    imageAlt: "Mobile payment illustration",
  },
];

function DecorativePlant() {
  return (
    <svg
      width="151"
      height="267"
      viewBox="0 0 151 267"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: "clamp(90px, 20vw, 151px)", height: "auto" }}
    >
      <g clipPath="url(#clip0_9022_2199)">
        <path
          d="M44.8835 102.634C52.4473 101.991 59.608 100.972 66.8092 100.851C82.7684 100.583 98.1676 103.33 111.868 113.064C127.29 124.026 132.241 141.369 124.831 158.878C123.197 162.736 121.101 166.429 118.838 169.926C116.579 173.415 113.84 176.568 111.042 180.211C112.769 180.992 114.439 181.711 116.082 182.497C129.62 188.929 134.698 200.591 130.065 215.112C127.026 224.635 121.809 232.732 114.748 239.478C113.561 240.612 112.237 241.679 110.803 242.425C107.523 244.131 104.105 244.735 100.904 241.995C97.6668 239.218 96.7374 235.707 97.5018 231.451C98.473 226.09 99.863 220.64 99.7098 215.243C99.2031 197.687 90.2365 185.491 75.4089 177.837C62.1025 170.975 48.2647 170.385 34.2456 174.333C33.6914 174.49 33.1485 174.728 32.6209 174.97C32.4256 175.061 32.2992 175.294 32.0548 175.546C37.2644 183.552 42.1785 191.806 47.7865 199.508C53.2796 207.056 61.1881 209.635 69.9887 209.486C74.901 209.4 79.8148 209.351 84.7267 209.545C89.1881 209.721 92.1837 212.447 93.8397 216.645C95.5962 221.092 95.2166 225.456 92.0826 228.957C90.3072 230.944 88.1441 232.967 85.7563 233.856C74.6882 237.986 63.2241 240.205 51.3217 238.763C32.9829 236.54 20.7105 225.625 13.3292 208.327C5.47707 189.92 3.99843 170.548 5.6086 150.987C6.42667 141.075 8.45707 131.3 10.0067 121.031C-20.7429 100.868 -40.7002 72.2104 -46.5554 32.8243C-27.4244 34.7967 -12.0182 42.8687 0.521139 57.1076C12.8153 71.0629 19.4928 87.805 22.9706 106.884C28.4599 69.1446 37.7857 34.4068 69.5377 10.8724C83.1792 48.8921 69.2189 77.3436 44.8835 102.634ZM86.7005 144.635C82.3199 145.657 78.9744 148.926 78.3593 152.861C77.8576 156.066 78.9633 158.653 81.5462 160.492C84.56 162.64 89.6094 162.273 93.1333 159.748C96.9661 157.001 98.4343 152.455 96.7135 148.665C95.1455 145.195 91.1631 143.594 86.6936 144.636L86.7005 144.635ZM92.6975 138.867C95.7536 130.798 101.393 128.33 109.054 129.705C105.903 124.113 100.256 122.223 95.7308 124.683C91.461 127.002 89.8046 133.109 92.6992 138.874L92.6975 138.867ZM69.8632 150.356C68.1305 146.576 65.2134 144.911 61.5651 144.639C57.835 144.356 54.3131 146.638 53.0024 150.272C51.9501 153.181 51.6667 156.177 53.7476 159.968C57.0666 152.103 62.2392 149.139 69.8632 150.356Z"
          fill="#052224"
          fillOpacity="0.84"
        />
      </g>
      <defs>
        <clipPath id="clip0_9022_2199">
          <rect
            width="147"
            height="240"
            fill="white"
            transform="translate(-47 32.9265) rotate(-12.9435)"
          />
        </clipPath>
      </defs>
    </svg>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const isLast = step === slides.length - 1;

  function handleNext() {
    if (isLast) {
      router.push("/auth/login");
    } else {
      setStep((s) => s + 1);
    }
  }

  const { heading, image, imageAlt } = slides[step];

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col overflow-hidden"
      style={{ background: "var(--brand-green)" }}
    >
      {/* ── Top 38vh — green, heading ── */}
      <div
        className="relative flex flex-col items-center justify-center px-10"
        style={{ height: "38vh" }}
      >
        <h1
          className="text-center font-semibold capitalize"
          style={{
            color: "var(--brand-dark-mid)",
            fontFamily: "Poppins, var(--font-sans)",
            fontSize: "clamp(22px, 5vw, 30px)",
            lineHeight: 1.3,
            maxWidth: "min(289px, 80vw)",
          }}
        >
          {heading}
        </h1>
      </div>

      {/* ── Bottom 62vh — pale card, rounded top ── */}
      <div
        className="relative flex flex-col items-center justify-end overflow-visible"
        style={{
          height: "62vh",
          background: "var(--brand-green-pale)",
          borderTopLeftRadius: "clamp(48px, 12vw, 90px)",
          borderTopRightRadius: "clamp(48px, 12vw, 90px)",
          paddingBottom: "clamp(24px, 5vh, 48px)",
        }}
      >
        {/* Plant — base at the top-left curve, leans left */}
        <div
          className="pointer-events-none absolute"
          style={{
            left: "clamp(8px, 4vw, 24px)",
            /* bottom of plant sits exactly on the card's top edge */
            bottom: "100%",
            transformOrigin: "bottom left",
            transform: "rotate(-8deg)",
            zIndex: 20,
          }}
        >
          <DecorativePlant />
        </div>

        {/* Illustration + circle — sits in upper 50% of card */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            top: "8%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: "clamp(160px, 38vw, 220px)",
              height: "clamp(160px, 38vw, 220px)",
              background: "var(--brand-green-circle)",
            }}
          />
          <div className="relative z-10">
            <Image
              src={image}
              alt={imageAlt}
              width={240}
              height={240}
              priority
              style={{
                objectFit: "contain",
                width: "clamp(160px, 38vw, 240px)",
                height: "clamp(160px, 38vw, 240px)",
              }}
            />
          </div>
        </div>

        {/* Dots */}
        <div className="mb-4 flex items-center gap-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === step ? 13 : 11,
                height: i === step ? 13 : 11,
                borderRadius: "50%",
                background: i === step ? "var(--brand-green)" : "transparent",
                border: i === step ? "none" : "2px solid var(--brand-dark-mid)",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.2s",
              }}
            />
          ))}
        </div>

        {/* Next / Get Started */}
        <button
          onClick={handleNext}
          className="flex items-center justify-center rounded-full font-semibold capitalize transition hover:opacity-80 active:scale-[0.98]"
          style={{
            background: isLast ? "var(--brand-green)" : "var(--brand-dark)",
            color: isLast ? "#ffffff" : "var(--brand-green-pale)",
            fontFamily: "Poppins, var(--font-sans)",
            fontSize: "clamp(16px, 4vw, 20px)",
            height: "clamp(44px, 7vh, 52px)",
            width: "min(240px, 65vw)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          }}
        >
          {isLast ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
}
