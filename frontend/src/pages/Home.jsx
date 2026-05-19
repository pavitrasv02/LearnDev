import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import CourseCard from "../components/CourseCard";
import Stats from "../components/Stats";
import Testimonials from "../components/Testimonials";
import Pricing from "../components/Pricing";
import FAQ from "../components/FAQ";
import { CourseCardSkeleton } from "../components/Skeleton";
import api from "../api/axios";

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/courses?featured=true&limit=4")
      .then((res) => setCourses(res.data.courses))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Hero />
      <Stats />
      <section className="section-padding">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold">
            Featured <span className="gradient-text">Courses</span>
          </h2>
          <Link to="/courses" className="text-brand-500 font-medium hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array(4).fill(0).map((_, i) => <CourseCardSkeleton key={i} />)
            : courses.map((c, i) => <CourseCard key={c._id} course={c} index={i} />)}
        </div>
      </section>
      <Testimonials />
      <Pricing />
      <FAQ />
    </>
  );
}
