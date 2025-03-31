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
        document.getElementById('shareBtn').style.display = 'block';
    } catch (error) {
        console.error('خطأ:', error);
        alert('حدث خطأ أثناء إنشاء البطاقة. الرجاء المحاولة مرة أخرى.');
        canvas.style.opacity = '1';
        document.getElementById('shareBtn').style.display = 'none';
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

// تحديث دالة المشاركة عبر فيسبوك
async function shareOnFacebook() {
    try {
        // الحصول على نوع البطاقة والاسم
        const template = document.getElementById('templateSelect').value;
        const name = document.getElementById('nameInput').value;
        
        // تحويل الكانفاس إلى صورة
        const imageUrl = canvas.toDataURL('image/png');
        
        // إنشاء نص المشاركة حسب نوع البطاقة
        let shareText;
        switch(template) {
            case 'promotion':
                shareText = `🌙 بطاقة تهنئة بالعيد صممتها لـ ${name}\n`;
                break;
            case 'birthday':
                shareText = `🎂 بطاقة عيد ميلاد صممتها لـ ${name}\n`;
                break;
            case 'graduation':
                shareText = `🎓 بطاقة تخرج صممتها لـ ${name}\n`;
                break;
        }
        
        // إضافة رابط الموقع
        shareText += "\n✨ صمم بطاقتك الخاصة مجاناً:\n";
        shareText += "https://img-edite.netlify.app/";

        // إضافة Facebook SDK إذا لم يكن موجوداً
        if (!window.FB) {
            await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://connect.facebook.net/ar_AR/sdk.js';
                script.async = true;
                script.defer = true;
                script.crossorigin = 'anonymous';
                script.onload = resolve;
                document.head.appendChild(script);
                
                window.fbAsyncInit = function() {
                    FB.init({
                        appId: '1807101829859344',
                        version: 'v18.0',
                        xfbml: true
                    });
                };
            });
        }

        // استخدام Facebook SDK للمشاركة
        FB.ui({
            method: 'feed',
            link: 'https://img-edite.netlify.app/',
            picture: imageUrl,
            caption: 'صانع البطاقات السحري',
            description: shareText,
            hashtag: '#صانع_البطاقات_السحري'
        }, function(response) {
            if (response && !response.error_message) {
                alert('تمت المشاركة بنجاح! 🎉');
            } else {
                // إذا فشلت المشاركة المباشرة، نستخدم الطريقة البديلة
                const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?` +
                    `u=${encodeURIComponent('https://img-edite.netlify.app/')}` +
                    `&quote=${encodeURIComponent(shareText)}` +
                    `&hashtag=${encodeURIComponent('#صانع_البطاقات_السحري')}`;

                if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                    window.location.href = fbShareUrl;
                } else {
                    window.open(fbShareUrl, 'facebook-share', 'width=580,height=296');
                }
            }
        });

    } catch (error) {
        console.error('خطأ في المشاركة:', error);
        alert('عذراً، حدث خطأ أثناء محاولة المشاركة. يرجى المحاولة مرة أخرى.');
    }
}

// محتوى الصفحات المنبثقة
const pageContents = {
    privacy: {
        content: `
            <h2>سياسة الخصوصية</h2>
            <div class="policy-content">
                <section>
                    <h3>1. مقدمة</h3>
                    <p>نحن في "صانع البطاقات السحري" نقدر خصوصية مستخدمينا ونلتزم بحمايتها. تشرح هذه السياسة كيفية تعاملنا مع معلوماتك عند استخدام موقعنا.</p>
                </section>

                <section>
                    <h3>2. المعلومات التي نجمعها</h3>
                    <ul>
                        <li>الأسماء المستخدمة في إنشاء البطاقات</li>
                        <li>نوع البطاقات المنشأة</li>
                        <li>معلومات تقنية مثل نوع المتصفح وتوقيت الزيارة</li>
                    </ul>
                </section>

                <section>
                    <h3>3. كيفية استخدام المعلومات</h3>
                    <ul>
                        <li>تحسين خدماتنا وتجربة المستخدم</li>
                        <li>إنشاء البطاقات المطلوبة</li>
                        <li>تحليل استخدام الموقع لتطويره</li>
                    </ul>
                </section>

                <section>
                    <h3>4. مشاركة المحتوى</h3>
                    <p>عند مشاركة البطاقات على وسائل التواصل الاجتماعي، يتم ذلك بموافقتك الصريحة. نحن لا نشارك معلوماتك الشخصية مع أي طرف ثالث دون إذنك.</p>
                </section>

                <section>
                    <h3>5. حماية المعلومات</h3>
                    <p>نتخذ إجراءات أمنية مناسبة لحماية معلوماتك من الوصول غير المصرح به أو التعديل أو الإفصاح أو الإتلاف.</p>
                </section>

                <section>
                    <h3>6. حقوق المستخدم</h3>
                    <p>لديك الحق في:</p>
                    <ul>
                        <li>الوصول إلى معلوماتك الشخصية</li>
                        <li>تصحيح معلوماتك</li>
                        <li>حذف معلوماتك</li>
                        <li>الاعتراض على معالجة معلوماتك</li>
                    </ul>
                </section>

                <section>
                    <h3>7. التواصل معنا</h3>
                    <p>إذا كان لديك أي أسئلة حول سياسة الخصوصية، يمكنك التواصل معنا عبر:</p>
                    <p>البريد الإلكتروني: privacy@cardmaker.com</p>
                </section>

                <section>
                    <h3>8. تحديثات السياسة</h3>
                    <p>قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سيتم نشر أي تغييرات على هذه الصفحة.</p>
                    <p>آخر تحديث: ${new Date().toLocaleDateString('ar-EG')}</p>
                </section>
            </div>
        `
    },
    terms: {
        content: `
            <h2>شروط الاستخدام</h2>
            <div class="policy-content">
                <section>
                    <h3>1. القبول بالشروط</h3>
                    <p>باستخدامك لموقع "صانع البطاقات السحري"، فإنك توافق على الالتزام بهذه الشروط والأحكام.</p>
                </section>

                <section>
                    <h3>2. وصف الخدمة</h3>
                    <p>نقدم خدمة إنشاء وتصميم بطاقات تهنئة رقمية للمناسبات المختلفة. جميع الصور المستخدمة مرخصة من Pexels.</p>
                </section>

                <section>
                    <h3>3. حقوق الملكية الفكرية</h3>
                    <ul>
                        <li>جميع حقوق الملكية الفكرية للموقع محفوظة</li>
                        <li>البطاقات المنشأة مخصصة للاستخدام الشخصي فقط</li>
                        <li>يمنع إعادة بيع البطاقات المنشأة أو استخدامها تجارياً</li>
                    </ul>
                </section>

                <section>
                    <h3>4. قواعد الاستخدام</h3>
                    <p>يجب عليك:</p>
                    <ul>
                        <li>عدم استخدام محتوى مسيء أو غير لائق</li>
                        <li>عدم انتهاك حقوق الآخرين</li>
                        <li>عدم استخدام الموقع لأغراض غير قانونية</li>
                        <li>عدم محاولة اختراق أو تعطيل الموقع</li>
                    </ul>
                </section>

                <section>
                    <h3>5. المسؤولية القانونية</h3>
                    <p>نحن غير مسؤولين عن:</p>
                    <ul>
                        <li>أي استخدام غير مصرح به للبطاقات المنشأة</li>
                        <li>أي أضرار ناتجة عن استخدام الموقع</li>
                        <li>انقطاع الخدمة أو عدم توفرها</li>
                    </ul>
                </section>

                <section>
                    <h3>6. التعديلات</h3>
                    <p>نحتفظ بالحق في:</p>
                    <ul>
                        <li>تعديل هذه الشروط في أي وقت</li>
                        <li>تغيير أو إيقاف الخدمة مؤقتاً أو نهائياً</li>
                        <li>رفض الخدمة لأي مستخدم يخالف هذه الشروط</li>
                    </ul>
                </section>

                <section>
                    <h3>7. الاتصال بنا</h3>
                    <p>إذا كان لديك أي استفسارات حول شروط الاستخدام، يمكنك التواصل معنا عبر:</p>
                    <p>البريد الإلكتروني: terms@cardmaker.com</p>
                </section>

                <section>
                    <h3>8. القانون المطبق</h3>
                    <p>تخضع هذه الشروط والأحكام للقوانين المعمول بها في بلد المستخدم.</p>
                    <p>آخر تحديث: ${new Date().toLocaleDateString('ar-EG')}</p>
                </section>
            </div>
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
