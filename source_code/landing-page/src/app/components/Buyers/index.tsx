import Image from 'next/image';

interface cardDataType {
    imgSrc: string;
    heading: string;
    percent: string;
    subheading: string;
}

const cardData: cardDataType[] = [
    {
        imgSrc: '/assets/buyers/ourbuyers.svg',
        percent: '5,000+',
        heading: "Doanh nghiệp tin tưởng",
        subheading: "Các doanh nghiệp đã tin tưởng và sử dụng hệ thống quản lý của chúng tôi.",
    },
    {
        imgSrc: '/assets/buyers/projectcompleted.svg',
        percent: '50,000+',
        heading: "Dự án hoàn thành",
        subheading: "Số lượng dự án đã được quản lý và hoàn thành thành công trên hệ thống.",
    },
    {
        imgSrc: '/assets/buyers/happybuyers.svg',
        percent: '98%',
        heading: "Khách hàng hài lòng",
        subheading: "Tỷ lệ khách hàng hài lòng với chất lượng dịch vụ và sản phẩm của chúng tôi.",
    },
    {
        imgSrc: '/assets/buyers/teammembers.svg',
        percent: '100+',
        heading: "Chuyên gia hỗ trợ",
        subheading: "Đội ngũ chuyên gia giàu kinh nghiệm luôn sẵn sàng hỗ trợ khách hàng 24/7.",
    }

]

const Buyers = () => {
    return (
        <div className='mx-auto max-w-7xl py-16 px-6'>
            <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-y-20 gap-x-5'>
                {cardData.map((items, i) => (
                    <div className='flex flex-col justify-center items-center' key={i}>
                        <div className='flex justify-center border border-border  p-2 w-10 rounded-lg'>
                            <Image src={items.imgSrc} alt={items.imgSrc} width={30} height={30} />
                        </div>
                        <h2 className='text-4xl lg:text-6xl text-black font-semibold text-center mt-5'>{items.percent}</h2>
                        <h3 className='text-2xl text-black font-semibold text-center lg:mt-6'>{items.heading}</h3>
                        <p className='text-lg font-normal text-black text-center text-opacity-50 mt-2'>{items.subheading}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Buyers;
