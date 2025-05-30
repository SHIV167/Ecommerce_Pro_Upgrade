import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '@/styles/category-slider.css';

export default function CategorySection() {
  const defaultCategories = [
    {
      _id: "1",
      name: "TRAVEL",
      slug: "travel",
      imageUrl: "/uploads/sections/herbs_01.png",
      featured: true
    },
    {
      _id: "2",
      name: "GIFT CARD",
      slug: "gift-card",
      imageUrl: "/uploads/sections/herbs_02.png",
      featured: true
    },
    {
      _id: "3",
      name: "GIFTING",
      slug: "gifting",
      imageUrl: "/uploads/sections/herbs_03.png",
      featured: true
    },
    {
      _id: "4",
      name: "FACE",
      slug: "face",
      imageUrl: "/uploads/sections/herbs_01.png",
      featured: true
    },
    {
      _id: "5",
      name: "BODY",
      slug: "body",
      imageUrl: "/uploads/sections/herbs_02.png",
      featured: true
    },
    {
      _id: "6",
      name: "MAKEUP",
      slug: "makeup",
      imageUrl: "/uploads/sections/herbs_03.png",
      featured: true
    },
    {
      _id: "7",
      name: "HAIR",
      slug: "hair",
      imageUrl: "/uploads/sections/herbs_01.png",
      featured: true
    },
    {
      _id: "8",
      name: "MEN",
      slug: "men",
      imageUrl: "/uploads/sections/herbs_02.png",
      featured: true
    }
  ] as Category[];

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories/featured'],
  });

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 relative">
        <h2 className="font-heading text-2xl text-center mb-10">Shop By Category</h2>
        <Slider
          dots={true}
          arrows={true}
          infinite={true}
          speed={500}
          autoplay={true}
          autoplaySpeed={3000}
          pauseOnHover={true}
          slidesToShow={8}
          slidesToScroll={1}
          className="category-slider -mx-2"
          responsive={[
            {
              breakpoint: 1280,
              settings: {
                slidesToShow: 6,
                slidesToScroll: 2
              }
            },
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: 4,
                slidesToScroll: 2
              }
            },
            {
              breakpoint: 768,
              settings: {
                slidesToShow: 3,
                slidesToScroll: 1
              }
            },
            {
              breakpoint: 640,
              settings: {
                slidesToShow: 2,
                slidesToScroll: 1
              }
            }
          ]}
        >
          {displayCategories.map((category) => (
            <div key={category._id} className="px-2">
              <Link href={`/categories/${category.slug}`} className="block group">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
                  <img 
                    src={category.mobileImageUrl || category.desktopImageUrl || category.imageUrl} 
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center transition-opacity group-hover:bg-opacity-30">
                    <h3 className="text-white text-sm font-medium tracking-wider uppercase text-center px-2 w-full">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
}
