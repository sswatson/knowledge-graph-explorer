import { ArrowRelation } from '@relationalai/rai-sdk-javascript/web';

import { collectValues } from '../outputUtils';

type ImgProps = {
  relations: ArrowRelation[];
};

export default function Img({ relations }: ImgProps) {
  const values = collectValues<string>('/:image/', relations);

  return (
    <div data-testid='img-mime' className='prose max-w-none'>
      {values.map((image, index) => (
        <img key={index + image} alt='' src={image} />
      ))}
    </div>
  );
}
