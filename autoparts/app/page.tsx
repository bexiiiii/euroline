
import React from 'react';
import Header from "../components/Header";
import CategoriesSection from "../components/CategoriesSection";
import HeroSection from "../components/HeroSection";
import BusinessSection from "../components/BusinessSection";
import PromoSection from "../components/PromoSection";
import BrandsSection from "../components/BrandsSection";
import NewsSection from "../components/NewsSection";
import SearchSection from "../components/SearchSection";
import Footer from "../components/Footer";
import AboutSection from '../components/AboutSection';
import CarouselComponent from '@/components/CarouselComponent';

import SignupPage from './(routes)/auth/signup/page';

import CategoriesCarousel from '@/components/CategoriesCarousel';
import BrandsCarousel from '@/components/BrandsCarousel';
import { Footerdemo } from '@/components/ui/footer-section';
import Container from '@/components/ui/Container';




const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      
      <main>
        <Container>
          <SearchSection />
          {/* <HeroSection /> */}
          <CarouselComponent />
          
        </Container>
        <CategoriesCarousel />
        <BusinessSection />
        <BrandsCarousel />
        <PromoSection />
        <NewsSection />
        <AboutSection />
      </main>
       
       
    </div>
  );
};

export default HomePage;
