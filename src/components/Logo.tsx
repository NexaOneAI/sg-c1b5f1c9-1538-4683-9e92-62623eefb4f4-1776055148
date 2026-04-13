import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
}

export function Logo({ size = "md", showText = true, href }: LogoProps) {
  const dimensions = {
    sm: { img: 32, text: "text-lg" },
    md: { img: 48, text: "text-2xl" },
    lg: { img: 64, text: "text-4xl" },
  };

  const { img, text } = dimensions[size];

  const content = (
    <div className="flex items-center gap-3">
      <Image
        src="/inbound6875946183305017278.jpg"
        alt="Nexa One"
        width={img}
        height={img}
        className="rounded-lg"
        priority
      />
      {showText && (
        <span className={`${text} font-bold neon-text-primary font-['Orbitron']`}>
          Nexa One
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}