import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
}

export function Logo({ size = "md", showText = true, href = "/" }: LogoProps) {
  const sizes = {
    sm: { image: 32, text: "text-lg" },
    md: { image: 48, text: "text-2xl" },
    lg: { image: 64, text: "text-3xl" },
  };

  const content = (
    <div className="flex items-center gap-3">
      <Image
        src="/inbound6875946183305017278.jpg"
        alt="Nexa One"
        width={sizes[size].image}
        height={sizes[size].image}
        className="object-contain glow-purple"
        priority
      />
      {showText && (
        <span className={`font-display font-bold cyber-gradient-text ${sizes[size].text}`}>
          NEXA ONE
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