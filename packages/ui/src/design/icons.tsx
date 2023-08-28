import { SVGProps } from 'react';

export function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className='ionicon'
      viewBox='0 0 512 512'
      stroke='currentColor'
      {...props}
    >
      <path
        d='M112 111v290c0 17.44 17 28.52 31 20.16l247.9-148.37c12.12-7.25 12.12-26.33 0-33.58L143 90.84c-14-8.36-31 2.72-31 20.16z'
        fill='currentColor'
        strokeMiterlimit='10'
        strokeWidth='40'
      />
    </svg>
  );
}

export function StopIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      stroke='currentColor'
      {...props}
    >
      <rect
        x='4'
        y='4'
        width='16'
        height='16'
        rx='2'
        fill='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

export function RelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500' {...props}>
      <rect
        fill='currentColor'
        strokeWidth='0'
        x='25'
        y='25'
        width='450'
        height='450'
      />
      <text
        fontFamily='Arial, Helvetica, sans-serif'
        textAnchor='start'
        fontSize='220'
        y='430'
        x='100'
        fill='#ffffff'
      >
        Rel
      </text>
    </svg>
  );
}

export function RelationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500' {...props}>
      <circle
        cx='110'
        cy='115'
        r='80'
        stroke='currentColor'
        strokeWidth='70'
        fill='none'
      />
      <circle
        cx='410'
        cy='170'
        r='60'
        stroke='currentColor'
        strokeWidth='60'
        fill='none'
      />
      <circle
        cx='290'
        cy='420'
        r='60'
        stroke='currentColor'
        strokeWidth='55'
        fill='none'
      />

      <line
        x1='135'
        y1='180'
        x2='245'
        y2='370'
        stroke='currentColor'
        strokeWidth='55'
      />
      <line
        x1='305'
        y1='370'
        x2='380'
        y2='230'
        stroke='currentColor'
        strokeWidth='60'
      />
      <line
        x1='360'
        y1='150'
        x2='190'
        y2='120'
        stroke='currentColor'
        strokeWidth='65'
      />
    </svg>
  );
}

export function WorksheetsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 512.001 512.001'
      stroke='currentColor'
      {...props}
    >
      <path
        d='M508.788,174.522c-3.286-5.89-8.671-10.149-15.16-11.991l-56.983-16.167c-4.474-1.267-9.127,1.328-10.397,5.801
              c-1.268,4.473,1.328,9.127,5.801,10.397l56.983,16.167c4.466,1.267,7.068,5.931,5.8,10.396l-68.876,242.749
              c-0.614,2.164-2.034,3.958-3.997,5.053s-4.235,1.359-6.312,0.772l-67.876-20.056h34.388c13.926,0,25.254-11.328,25.254-25.254
              V82.413c0-13.926-11.328-25.254-25.254-25.254H129.831c-13.926,0-25.254,11.328-25.254,25.254v309.978
              c0,13.926,11.328,25.254,25.254,25.254h37.195l-70.595,20.03c-2.163,0.614-4.436,0.35-6.4-0.747
              c-1.963-1.095-3.383-2.89-3.997-5.053l-68.876-242.75c-1.267-4.466,1.335-9.128,5.801-10.396l58.857-16.699
              c4.473-1.269,7.069-5.924,5.801-10.397c-1.269-4.473-5.925-7.068-10.396-5.801l-58.858,16.699
              C4.967,166.333-2.839,180.324,0.962,193.72L69.836,436.47c1.842,6.49,6.1,11.874,11.991,15.16
              c3.814,2.128,8.017,3.212,12.268,3.212c2.314,0,4.643-0.322,6.931-0.971l127.681-36.226h59.654l122.606,36.226
              c2.289,0.65,4.616,0.971,6.931,0.971c4.25,0,8.454-1.084,12.267-3.212c5.891-3.286,10.149-8.67,11.991-15.16L511.03,193.72
              C512.872,187.231,512.076,180.413,508.788,174.522z M289.423,400.809H129.831c-4.642,0-8.418-3.777-8.418-8.418V82.413
              c0-4.642,3.776-8.418,8.418-8.418h252.331c4.641,0,8.418,3.776,8.418,8.418v309.978c0,4.642-3.777,8.418-8.418,8.418h-92.643
              C289.487,400.809,289.455,400.809,289.423,400.809z'
        fill='currentColor'
        strokeMiterlimit='10'
        strokeWidth='10'
      />
    </svg>
  );
}

export function SidePanelOpenBottomIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 32 32'
      stroke='currentColor'
      {...props}
    >
      <path
        d='M28,4H4A2,2,0,0,0,2,6V26a2,2,0,0,0,2,2H28a2,2,0,0,0,2-2V6A2,2,0,0,0,28,4Zm0,2V18H4V6Z'
        fill='currentColor'
      />
    </svg>
  );
}

export function SidePanelOpenLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 32 32'
      stroke='currentColor'
      {...props}
    >
      <path
        d='M28,4H4A2,2,0,0,0,2,6V26a2,2,0,0,0,2,2H28a2,2,0,0,0,2-2V6A2,2,0,0,0,28,4Zm0,22H12V6H28Z'
        fill='currentColor'
      />
    </svg>
  );
}

export function MarkdownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='208'
      height='128'
      viewBox='0 0 208 128'
      {...props}
    >
      <rect
        width='198'
        height='118'
        x='5'
        y='5'
        ry='10'
        stroke='currentColor'
        strokeWidth='10'
        fill='none'
      />
      <path
        fill='currentColor'
        d='M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zm125 0l-30-33h20V30h20v35h20z'
      />
    </svg>
  );
}
