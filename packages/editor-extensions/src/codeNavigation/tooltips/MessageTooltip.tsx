type MessageTooltipProps = {
  text: string;
};

export function MessageTooltip({ text }: MessageTooltipProps) {
  return <div className='font-mono'>{text}</div>;
}
