"use client";

import { useState } from "react";
import DoctorCards from "@/components/doctorcards/DoctorCards";
import Footer from "@/components/footer/footer";
import Header from "@/components/header/header";
import HomeForm from "@/components/selectstatedist/HomeForm";
import SEOContent from "@/components/static/SeoContent";

export default function Home() {
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  return (
    <>
      <Header />
      <HomeForm onDistrictSelect={setSelectedDistrict} />
      {selectedDistrict && <DoctorCards districtId={selectedDistrict} />}
      <SEOContent />
      <Footer />
    </>
  );
}