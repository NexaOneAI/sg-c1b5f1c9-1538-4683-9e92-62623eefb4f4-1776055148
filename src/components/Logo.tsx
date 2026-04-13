import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
}

export function Logo({ size = "md", showText = false, href }: LogoProps) {
  const dimensions = {
    sm: { img: 120, height: 40 },
    md: { img: 180, height: 60 },
    lg: { img: 240, height: 80 },
  };

  const { img, height } = dimensions[size];

  const content = (
    <div className="flex items-center">
      <Image
        src="/logo.png"
        alt="Nexa One Life"
        width={img}
        height={height}
        className="object-contain"
        priority
      />
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