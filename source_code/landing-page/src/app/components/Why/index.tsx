import Image from "next/image";

interface whydata {
    heading: string;
    subheading: string;
}

const whydata: whydata[] = [
    {
        heading: "Chất lượng cao",
        subheading: "Sản phẩm được phát triển bởi đội ngũ chuyên gia giàu kinh nghiệm, đảm bảo chất lượng và hiệu suất tối ưu.",
    },
    {
        heading: "Hỗ trợ 24/7",
        subheading: "Đội ngũ hỗ trợ khách hàng chuyên nghiệp, sẵn sàng giải đáp mọi thắc mắc và hỗ trợ kỹ thuật 24/7.",
    },
    {
        heading: "Bảo mật tuyệt đối",
        subheading: "Hệ thống bảo mật đa lớp, mã hóa dữ liệu và sao lưu tự động đảm bảo an toàn thông tin doanh nghiệp.",
    }
]


const Why = () => {
    return (
        <div id="about">

            <div className='mx-auto max-w-7xl px-4 my-20 sm:py-20 lg:px-8'>
                <div className='grid grid-cols-1 lg:grid-cols-2'>

                    {/* COLUMN-1 */}
                    <div className="lg:-ml-64">
                        <Image src="/assets/why/iPad.png" alt="iPad-image" width={4000} height={900} />
                    </div>

                    {/* COLUMN-2 */}
                    <div>
                        <h3 className="text-4xl lg:text-5xl pt-4 font-semibold sm:leading-tight mt-5 text-center lg:text-start">Tại sao chọn chúng tôi?</h3>
                        <h4 className="text-lg pt-4 font-normal sm:leading-tight text-center text-beach lg:text-start">Đừng lãng phí thời gian cho các công việc thủ công. Hãy để hệ thống tự động hóa giúp bạn. Đơn giản hóa quy trình, giảm sai sót và tiết kiệm thời gian.</h4>

                        <div className="mt-10">
                            {whydata.map((items, i) => (
                                <div className="flex mt-4" key={i}>
                                    <div className="rounded-full h-10 w-12 flex items-center justify-center bg-circlebg">
                                        <Image src="/assets/why/check.svg" alt="check-image" width={24} height={24} />
                                    </div>
                                    <div className="ml-5">
                                        <h4 className="text-2xl font-semibold">{items.heading}</h4>
                                        <h5 className="text-lg text-beach font-normal mt-2">{items.subheading}</h5>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>

                </div>
            </div>

        </div>
    )
}

export default Why;
