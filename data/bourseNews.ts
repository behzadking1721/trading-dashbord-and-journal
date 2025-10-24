export interface BourseNews {
  id: string;
  title: string;
  publishDate: string; // ISO string
  source: string;
  summary: string;
  isImportant: boolean;
  tags: string[];
}

// Function to simulate API response
export const fetchMockBourseNews = (): Promise<BourseNews[]> => {
  const MOCK_BOURSE_NEWS: BourseNews[] = [
    {
      id: 'bn-1',
      title: 'شاخص کل بورس در آستانه کانال ۲.۱ میلیون واحدی',
      publishDate: new Date(Date.now() - 3600 * 1000 * 1).toISOString(), // 1 hour ago
      source: 'خبرگزاری تسنیم',
      summary: 'شاخص کل بورس تهران با رشد بیش از ۱۰ هزار واحدی به مقاومت مهم خود نزدیک می‌شود. تحلیلگران معتقدند در صورت عبور از این سطح، روند صعودی کوتاه‌مدت تقویت خواهد شد. ارزش معاملات خرد نیز افزایش یافته است.',
      isImportant: true,
      tags: ['شاخص کل'],
    },
    {
      id: 'bn-2',
      title: 'تصمیم جدید سازمان بورس در مورد دامنه نوسان',
      publishDate: new Date(Date.now() - 3600 * 1000 * 3).toISOString(), // 3 hours ago
      source: 'بورس پرس',
      summary: 'سازمان بورس و اوراق بهادار اعلام کرد که دامنه نوسان برای نمادهای بازار پایه از هفته آینده به حالت عادی باز خواهد گشت. این تصمیم در راستای افزایش نقدشوندگی بازار اتخاذ شده است. فعالان بازار واکنش‌های متفاوتی به این خبر نشان داده‌اند.',
      isImportant: true,
      tags: ['سازمان بورس', 'قوانین'],
    },
    {
      id: 'bn-3',
      title: 'افزایش تقاضا در نمادهای گروه خودرویی',
      publishDate: new Date(Date.now() - 3600 * 1000 * 5).toISOString(), // 5 hours ago
      source: 'کدال ۳۶۰',
      summary: 'نمادهای گروه خودرویی امروز با افزایش تقاضا و صف خرید روبرو شدند. این رشد پس از انتشار گزارش‌های ماهانه مطلوب این شرکت‌ها رخ داده است. "خودرو" و "خساپا" از پرمعامله‌ترین نمادهای امروز بودند.',
      isImportant: true,
      tags: ['نمادهای پرمعامله', 'خودرو'],
    },
    {
      id: 'bn-4',
      title: 'عرضه اولیه جدید در راه است',
      publishDate: new Date(Date.now() - 3600 * 1000 * 24).toISOString(), // 1 day ago
      source: 'نبض بورس',
      summary: 'یک شرکت فعال در حوزه فناوری اطلاعات برای عرضه اولیه در بازار فرابورس آماده می‌شود. جزئیات دقیق این عرضه به زودی توسط سازمان بورس اعلام خواهد شد. پیش‌بینی می‌شود این عرضه اولیه با استقبال خوبی مواجه شود.',
      isImportant: false,
      tags: ['عرضه اولیه'],
    },
  ];

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.1) { // 90% success rate
        resolve(MOCK_BOURSE_NEWS.sort((a,b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()));
      } else {
        reject(new Error('خطا در دریافت اطلاعات از سرور اخبار. لطفاً دوباره تلاش کنید.'));
      }
    }, 1200); // Simulate network delay
  });
};
