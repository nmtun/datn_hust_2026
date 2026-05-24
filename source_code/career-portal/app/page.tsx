import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div className="font-sans">
      <Header />
      <main className="pt-16">
        <Hero />
        <Services />

        {/* About Section */}
        <section id="about" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
              <div className="mt-12 lg:mt-0">
                <div className="relative mx-auto w-full max-w-lg">
                  <div className="relative w-full h-64 sm:h-72 md:h-80 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden shadow-xl">
                    <div className="absolute inset-0 flex items-center justify-center text-white text-opacity-90">
                      <div className="text-center">
                        <div className="text-4xl font-bold mb-2">5+</div>
                        <div className="text-sm uppercase tracking-wider">Năm kinh nghiệm</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-4xl">
                  Về TechCom
                </h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                  Được thành lập vào năm 2020, TechCom là công ty công nghệ chuyên cung cấp giải pháp sáng tạo cho các doanh nghiệp thuộc mọi quy mô.
                </p>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                  Đội ngũ của chúng tôi bao gồm các chuyên gia giàu kinh nghiệm, đam mê công nghệ và tận tâm cung cấp các giải pháp chất lượng cao.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Join Us Section */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              Tham gia Đội ngũ của Chúng tôi
            </h2>
            <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
              Chúng tôi luôn tìm kiếm những cá nhân tài năng để tham gia vào đội ngũ. Hãy xem các vị trí đang tuyển dụng.
            </p>
            <div className="mt-8">
              <a href="/careers" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50">
                Xem Vị trí Tuyển dụng
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
