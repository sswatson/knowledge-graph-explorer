import Link from 'next/link';
import { RiArrowRightSLine, RiHome8Line } from 'react-icons/ri';
import { UrlObject } from 'url';

export type BreadCrumbItem = {
  id?: string;
  name?: string;
  href: UrlObject;
  current?: boolean;
};

type BreadCrumbsProps = {
  pages: BreadCrumbItem[];
};

export function HomeBreadCrumb() {
  return (
    <li>
      <div>
        <Link href='/' className='text-gray-400 hover:text-gray-700'>
          <RiHome8Line className='flex-shrink-0 h-5 w-5' aria-hidden='true' />
          <span className='sr-only'>Home</span>
        </Link>
      </div>
    </li>
  );
}

export function BreadCrumb({ id, name, href, current }: BreadCrumbItem) {
  return (
    <li>
      <div className='flex items-center'>
        <RiArrowRightSLine
          className='flex-shrink-0 h-5 w-5 text-gray-300'
          aria-hidden='true'
        />
        <Link
          href={href}
          className='ml-4 text-sm font-medium text-gray-500 hover:text-gray-700'
          aria-current={current ? 'page' : undefined}
        >
          <span>
            {name ? name : ''}
            {id ? <code>&quot;{id}&quot;</code> : ''}
          </span>
        </Link>
      </div>
    </li>
  );
}

export function BreadCrumbs({ pages }: BreadCrumbsProps) {
  return (
    <nav className='h-12 flex px-6' aria-label='Breadcrumb'>
      <ul className='flex items-center space-x-4'>
        <HomeBreadCrumb />
        {pages.map(page => (
          <BreadCrumb key={page.id || page.name} {...page} />
        ))}
      </ul>
    </nav>
  );
}
