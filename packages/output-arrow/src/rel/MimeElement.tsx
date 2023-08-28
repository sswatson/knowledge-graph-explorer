import dynamic from 'next/dynamic';

import { ArrowRelation } from '@relationalai/rai-sdk-javascript/web';

import { MimeTypeRegExMap } from '../constants';

const Graphviz = dynamic(() => import('../mime/Graphviz'), {
  ssr: false,
});
const Html = dynamic(() => import('../mime/Html'), {
  ssr: false,
});
const Img = dynamic(() => import('../mime/Img'), {
  ssr: false,
});
const Json = dynamic(() => import('../mime/Json'), {
  ssr: false,
});
const Markdown = dynamic(() => import('../mime/Markdown'), {
  ssr: false,
});
const Svg = dynamic(() => import('../mime/Svg'), {
  ssr: false,
});
const Table = dynamic(() => import('../mime/Table'), {
  ssr: false,
});
const Vega = dynamic(() => import('../mime/Vega'), {
  ssr: false,
});

type MimeElementProps = {
  relations: ArrowRelation[];
  mimeType: string;
  isNested?: boolean;
};

export function MimeElement({
  relations,
  mimeType,
  isNested = false,
}: MimeElementProps) {
  let mimeElement = null;

  if (mimeType) {
    if (MimeTypeRegExMap.HTML.test(mimeType)) {
      mimeElement = <Html relations={relations} />;
    } else if (MimeTypeRegExMap.MARKDOWN.test(mimeType)) {
      mimeElement = <Markdown relations={relations} />;
    } else if (MimeTypeRegExMap.SVG.test(mimeType)) {
      mimeElement = <Svg relations={relations} />;
    } else if (MimeTypeRegExMap.IMAGE.test(mimeType)) {
      mimeElement = <Img relations={relations} />;
    } else if (MimeTypeRegExMap.JSON.test(mimeType)) {
      mimeElement = <Json relations={relations} />;
    } else if (MimeTypeRegExMap.TABLE.test(mimeType)) {
      mimeElement = <Table relations={relations} isNested={isNested} />;
    } else if (MimeTypeRegExMap.VEGA.test(mimeType)) {
      mimeElement = <Vega relations={relations} />;
    } else if (MimeTypeRegExMap.GRAPHVIZ.test(mimeType)) {
      mimeElement = <Graphviz relations={relations} isNested={isNested} />;
    }
  }

  return mimeElement;
}
