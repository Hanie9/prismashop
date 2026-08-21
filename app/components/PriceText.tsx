"use client";

type Props = {
  amount: number;
  className?: string;
  tomanClassName?: string;
  freeLabel?: string;
};

/** نمایش قیمت با فاصله حدود ۱ میلی‌متر قبل از «تومان» */
export default function PriceText({
  amount,
  className = "",
  tomanClassName = "",
  freeLabel,
}: Props) {
  if (freeLabel !== undefined && amount === 0) {
    return <span className={className}>{freeLabel}</span>;
  }

  return (
    <span className={className}>
      {amount.toLocaleString("fa-IR")}
      <span className={`ms-[1mm] inline-block ${tomanClassName}`}>تومان</span>
    </span>
  );
}
