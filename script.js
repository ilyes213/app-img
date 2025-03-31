const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('downloadBtn');

// تكوين الكانفاس
const CONFIG = {
    canvas: {
        width: 800,
        height: 600
    },
    fonts: {
        primary: "'Aref Ruqaa', 'Noto Naskh Arabic', 'Cairo'",
        sizes: {
            title: '65px',     // حجم أكبر للعنوان
            name: '55px',      // حجم مناسب للاسم
            subtitle: '40px'   // حجم متناسق للنص الفرعي
        }
    },
    colors: {
        overlay: 'rgba(0, 0, 0, 0.6)', // زيادة التعتيم قليلاً لوضوح النص
        text: '#ffffff'
    }
};

// تعيين أبعاد الكانفاس
canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

// تحديث قائمة القوالب
const TEMPLATES = {
    promotion: {
        emoji: '🎉',
        textTemplate: name => ({
            title: 'مبروك عيدك',
            name: name,
            subtitle: 'وكل عام وأنت بخير'
        })
    },
    birthday: {
        emoji: '🎂',
        textTemplate: name => ({
            title: 'عيد ميلاد سعيد',
            name: name,
            subtitle: '!'
        })
    },
    graduation: {
        emoji: '🎓',
        textTemplate: name => ({
            title: 'مبروك التخرج',
            name: name,
            subtitle: '!'
        })
    }
};

// الوظائف المساعدة
const helpers = {
    // تكوين الصور لكل نوع بطاقة
    imageConfigs: {
        promotion: {
            keywords: [
                'eid mubarak',
                'ramadan kareem',
                'islamic celebration',
                'muslim festival',
                'eid celebration'
            ],
            filters: 'landscape,featured,hd',
            minWidth: 800,
            minHeight: 600,
            per_page: 15 // جلب المزيد من الصور للاختيار منها
        },
        birthday: {
            keywords: [
                'birthday cake candles',
                'happy birthday decoration',
                'birthday party celebration',
                'birthday balloons cake',
                'colorful birthday party'
            ],
            filters: 'landscape,featured,hd',
            minWidth: 800,
            minHeight: 600,
            per_page: 15
        },
        graduation: {
            keywords: [
                'graduation ceremony university',
                'graduation cap diploma',
                'graduation celebration',
                'graduation success',
                'graduation achievement'
            ],
            filters: 'landscape,featured,hd',
            minWidth: 800,
            minHeight: 600,
            per_page: 15
        }
    },

    // تخزين الصور المستخدمة مؤخراً
    usedImages: {
        promotion: new Set(),
        birthday: new Set(),
        graduation: new Set()
    },

    // الحصول على صورة عشوائية
    async getRandomImage(template) {
        const config = this.imageConfigs[template];
        const keyword = config.keywords[Math.floor(Math.random() * config.keywords.length)];
        
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&orientation=landscape&size=large&per_page=${config.per_page}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': 'sNXsxEAOnsyFwtW59IZ409pe7A1cAuLTIMCnMZXE7kvWXvGZNBUXuJz5'
                }
            });
            
            if (!response.ok) throw new Error('فشل في جلب الصورة');
            
            const data = await response.json();
            if (data.photos && data.photos.length > 0) {
                // فلترة الصور غير المستخدمة مؤخراً
                const unusedPhotos = data.photos.filter(photo => 
                    !this.usedImages[template].has(photo.src.large)
                );

                if (unusedPhotos.length === 0) {
                    // إذا تم استخدام كل الصور، نمسح القائمة ونبدأ من جديد
                    this.usedImages[template].clear();
                    return data.photos[0].src.large;
                }

                // اختيار صورة عشوائية من الصور غير المستخدمة
                const randomPhoto = unusedPhotos[Math.floor(Math.random() * unusedPhotos.length)];
                
                // إضافة الصورة إلى قائمة الصور المستخدمة
                this.usedImages[template].add(randomPhoto.src.large);
                
                return randomPhoto.src.large;
            } else {
                return this.getDefaultImage(template);
            }
        } catch (error) {
            console.error('خطأ في جلب الصورة:', error);
            return this.getDefaultImage(template);
        }
    },

    // الصور الافتراضية
    defaultImages: {
        promotion: [
            'https://images.pexels.com/photos/2412704/pexels-photo-2412704.jpeg', // مسجد
            'https://images.pexels.com/photos/2412705/pexels-photo-2412705.jpeg'  // فانوس رمضان
        ],
        birthday: [
            'https://images.pexels.com/photos/1793037/pexels-photo-1793037.jpeg', // كيك عيد ميلاد
            'https://images.pexels.com/photos/796606/pexels-photo-796606.jpeg'    // بالونات
        ],
        graduation: [
            'https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg',   // قبعة تخرج
            'https://images.pexels.com/photos/1205651/pexels-photo-1205651.jpeg'  // حفل تخرج
        ]
    },

    // الحصول على صورة افتراضية
    getDefaultImage(template) {
        const images = this.defaultImages[template];
        return images[Math.floor(Math.random() * images.length)];
    },

    // تحميل الصورة مع معالجة الأخطاء
    async loadImage(url) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        
        return new Promise((resolve, reject) => {
            let retries = 3;
            
            const tryLoad = () => {
                img.onload = () => resolve(img);
                img.onerror = () => {
                    retries--;
                    if (retries > 0) {
                        console.log(`محاولة تحميل الصورة مرة أخرى (${retries}/3)`);
                        // تجربة صورة افتراضية
                        img.src = this.getDefaultImage(this.currentTemplate);
                    } else {
                        reject(new Error('فشل في تحميل الصورة'));
                    }
                };
                img.src = url;
            };
            
            tryLoad();
        });
    },

    // تحسين مظهر النص
    drawText(textConfig, y) {
        const { title, name, subtitle, emoji } = textConfig;
        
        // تحسين ظل النص
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
        
        ctx.fillStyle = CONFIG.colors.text;
        ctx.textAlign = 'center';
        
        // رسم العنوان بخط جميل
        ctx.font = `bold ${CONFIG.fonts.sizes.title} 'Aref Ruqaa'`;
        ctx.fillText(title, canvas.width/2, y);
        
        // رسم الاسم بخط مختلف قليلاً
        ctx.font = `bold ${CONFIG.fonts.sizes.name} 'Noto Naskh Arabic'`;
        ctx.fillText(name, canvas.width/2, y + 85);
        
        // رسم النص الفرعي
        ctx.font = `${CONFIG.fonts.sizes.subtitle} 'Cairo'`;
        const subtitleText = emoji ? `${subtitle} ${emoji}` : subtitle;
        ctx.fillText(subtitleText, canvas.width/2, y + 160);
        
        // إعادة تعيين الظل
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
};

// إنشاء البطاقة
async function generateCard() {
    const name = document.getElementById('nameInput').value;
    const template = document.getElementById('templateSelect').value;
    
    if (!name) {
        alert('الرجاء إدخال اسم');
        return;
    }

    try {
        canvas.style.opacity = '0.5';
        helpers.currentTemplate = template; // حفظ نوع البطاقة الحالي
        
        const imageUrl = await helpers.getRandomImage(template);
        const bg = await helpers.loadImage(imageUrl);
        
        canvas.style.opacity = '1';
        
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = CONFIG.colors.overlay;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const textConfig = TEMPLATES[template].textTemplate(name);
        helpers.drawText(textConfig, canvas.height/2 - 60);
        
        downloadBtn.style.display = 'block';
    } catch (error) {
        console.error('خطأ:', error);
        alert('حدث خطأ أثناء إنشاء البطاقة. الرجاء المحاولة مرة أخرى.');
        canvas.style.opacity = '1';
    }
}

// تحميل البطاقة
function downloadCard() {
    const timestamp = new Date().toLocaleString('ar-EG').replace(/[/:]/g, '-');
    const link = document.createElement('a');
    link.download = `بطاقة-تهنئة-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// محتوى الصفحات المنبثقة
const pageContents = {
    privacy: {
        content: `
            <h2>سياسة الخصوصية</h2>
            <p>نحن نهتم بخصوصية مستخدمينا. هذه السياسة توضح كيفية جمع واستخدام وحماية معلوماتك الشخصية.</p>
            <h3>جمع المعلومات</h3>
            <p>نحن نجمع فقط المعلومات الضرورية لتحسين تجربة المستخدم وتقديم خدماتنا.</p>
        `
    },
    terms: {
        content: `
            <h2>شروط الاستخدام</h2>
            <p>باستخدامك لموقعنا، فإنك توافق على الشروط والأحكام التالية.</p>
            <h3>الملكية الفكرية</h3>
            <p>جميع المحتويات والتصاميم محمية بحقوق الملكية الفكرية.</p>
        `
    },
    about: {
        content: `
            <h2>من نحن</h2>
            <p>نحن منصة متخصصة في إنشاء بطاقات التهنئة الرقمية بطريقة سهلة وسريعة.</p>
        `
    },
    contact: {
        content: `
            <h2>اتصل بنا</h2>
            <p>البريد الإلكتروني: info@gmail.com</p>
            <p>ساعات العمل: من الأحد إلى الخميس، 9 صباحاً - 5 مساءً</p>
        `
    }
};

// عرض النافذة المنبثقة
function showPage(pageId) {
    const modal = document.getElementById('pageModal');
    modal.querySelector('.modal-body').innerHTML = pageContents[pageId].content;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// إغلاق النافذة المنبثقة
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('pageModal').style.display = 'none';
    document.body.style.overflow = 'auto';
});

// إغلاق النافذة عند النقر خارجها
window.addEventListener('click', (e) => {
    const modal = document.getElementById('pageModal');
    if (e.target === modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// إضافة الخطوط الجديدة في رأس الصفحة
document.head.insertAdjacentHTML('beforeend', `
    <link href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
`); 