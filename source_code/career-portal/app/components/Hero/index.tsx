import Image from 'next/image';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative pt-20 pb-16 sm:pt-24 sm:pb-20 lg:pt-32 lg:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <h1 className="mt-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-gray-100 sm:mt-5 sm:text-5xl lg:mt-6 xl:text-6xl">
              <span className="block">Giải pháp</span>
              <span className="block text-blue-600 dark:text-blue-400">Công nghệ Tiên tiến</span>
            </h1>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-400 sm:mt-5 sm:text-lg">
              TechCom cung cấp giải pháp công nghệ tiên tiến cho doanh nghiệp. Từ phát triển web đến hạ tầng đám mây, chúng tôi giúp các công ty chuyển đổi sự hiện diện kỹ thuật số của họ.
            </p>
            <div className="mt-8 sm:flex sm:gap-4">
              <Link href="/careers" className="rounded-md shadow inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium text-white bg-blue-600 hover:bg-blue-700">
                Tham gia cùng chúng tôi
              </Link>
              <Link href="#services" className="mt-3 sm:mt-0 rounded-md inline-flex items-center justify-center px-5 py-3 border border-gray-300 dark:border-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                Dịch vụ của chúng tôi
              </Link>
            </div>
          </div>
          <div className="mt-12 lg:mt-0">
            <div className="relative mx-auto w-full max-w-lg">
              {/* Placeholder for hero image */}
              <div className="relative w-full h-64 sm:h-72 md:h-80 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden shadow-xl">
                <div className="absolute inset-0 flex items-center justify-center text-white text-3xl font-bold">
                  TechCom
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;