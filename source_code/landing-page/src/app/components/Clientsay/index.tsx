import Image from "next/image";

const Clientsay = () => {
    return (
        <div className="mx-auto max-w-2xl py-40 px-4s sm:px-6 lg:max-w-7xl lg:px-8">
            <div className="bg-image-what">
                <h3 className='text-navyblue text-center text-4xl lg:text-6xl font-semibold'>Khách hàng nói gì về chúng tôi</h3>
                <h4 className="text-lg font-normal text-darkgray text-center mt-4">Những phản hồi tích cực từ các doanh nghiệp đã sử dụng <br /> hệ thống quản lý của chúng tôi.</h4>

                <div className="lg:relative">
                    <Image src={'/assets/clientsay/avatars.png'} alt="avatar-image" width={1061} height={733} className="hidden lg:block" />

                    <span className="lg:absolute lg:bottom-40 lg:left-80">
                        <Image src={'/assets/clientsay/user.png'} alt="user-image" width={168} height={168} className="mx-auto pt-10 lg:pb-10" />
                        <div className="lg:inline-block bg-white rounded-2xl p-5 shadow-sm">
                            <p className="text-base font-normal text-center text-darkgray">Hệ thống quản lý doanh nghiệp này đã giúp công ty chúng tôi <br /> tối ưu hóa quy trình làm việc, tiết kiệm thời gian và chi phí đáng kể. <br /> Đội ngũ hỗ trợ rất chuyên nghiệp và nhiệt tình.</p>
                            <h3 className="text-2xl font-medium text-center py-2">Nguyễn Văn Minh</h3>
                            <h4 className="text-sm font-normal text-center">Giám đốc Công ty ABC</h4>
                        </div>
                    </span>

                </div>

            </div>
        </div>
    )
}

export default Clientsay;
