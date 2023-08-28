type LabelProps = {
  name: string;
  label: string;
};

export default function Label({ name, label }: LabelProps) {
  return (
    <div className='mb-1'>
      <label htmlFor={name} className='block text-sm font-medium text-gray-700'>
        {label}
      </label>
    </div>
  );
}
