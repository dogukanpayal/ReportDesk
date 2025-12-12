import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import sequelize from '../utils/db.js';
import { User, Report, DailyWarning } from '../models/index.js';

// Mevcut kullanıcının bilgilerini getir
export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        'id', 
        'email', 
        ['first_name', 'firstName'], 
        ['last_name', 'lastName'], 
        'role', 
        'createdAt'
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ 
      message: 'Kullanıcı bilgileri getirilirken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const getReporters = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{
        model: Report,
        attributes: [], // We only need to know that a report exists
        required: true, // This creates an INNER JOIN
      }],
      attributes: ['id', 'first_name', 'last_name'],
      group: ['User.id', 'User.first_name', 'User.last_name'],
      order: [['first_name', 'ASC']],
    });
    res.json(users);
  } catch (err) {
    console.error('Error fetching reporters:', err.message);
    res.status(500).json({ 
      message: 'Rapor yükleyenler getirilirken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const updateMe = async (req, res) => {
  const { firstName, lastName, email } = req.body;
  
  // Debug log - sadece development ortamında (sensitive data olmadan)
  if (process.env.NODE_ENV === 'development') {
    console.log('updateMe - User ID:', req.user.id, 'Fields:', Object.keys(req.body));
  }
  
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email.toLowerCase(); // Case-insensitive
    }
    
    // Input validation
    if (firstName && typeof firstName === 'string') {
      user.firstName = firstName.trim();
    }
    if (lastName && typeof lastName === 'string') {
      user.lastName = lastName.trim();
    }
    
    await user.save();

    const response = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
    
    res.json(response);
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).json({ 
      message: 'Kullanıcı güncellenirken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    // Gerekli alanları kontrol et
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mevcut şifre ve yeni şifre gereklidir' });
    }

    // Yeni şifre validasyonu (authController ile aynı kurallar)
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Yeni şifre en az 8 karakter olmalıdır' });
    }
    if (newPassword.length > 128) {
      return res.status(400).json({ message: 'Yeni şifre en fazla 128 karakter olabilir' });
    }
    
    // Şifre güçlülük kontrolü
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: 'Şifre en az bir küçük harf, bir büyük harf ve bir rakam içermelidir' 
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mevcut şifreyi doğrula
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Mevcut şifre yanlış' });
    }

    // Yeni şifreyi hash'le (authController ile aynı BCrypt rounds)
    const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    
    // Şifreyi güncelle
    user.passwordHash = hashedPassword;
    await user.save();
    
    res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (err) {
    console.error('Error changing password:', err.message);
    res.status(500).json({ 
      message: 'Şifre değiştirilirken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Mevcut kullanıcının hesabını sil
export const deleteMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Kullanıcıya ait raporları da sil
    await Report.destroy({
      where: { userId: req.user.id }
    });
    
    // Kullanıcıyı sil
    await user.destroy();
    
    res.json({ message: 'Hesabınız başarıyla silindi' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ 
      message: 'Hesap silinirken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Yönetici için kullanıcı listesi endpoint'i
export const getAllUsers = async (req, res) => {
  try {
    // Sadece yöneticilerin erişebileceği kontrol edilmeli (middleware'de yapılacak)
    if (req.user.role !== 'Yonetici') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
    }

    // Sayfalama parametreleri - hatalı girişlere karşı koruma
    let page = 0;
    let limit = 10;
    
    try {
      // String olarak gelen değerleri sayıya çevir
      if (req.query.page !== undefined) {
        page = Math.max(0, parseInt(req.query.page));
      }
      
      if (req.query.limit !== undefined) {
        limit = Math.max(1, Math.min(50, parseInt(req.query.limit))); // 1-50 arası sınırla
      }
    } catch (e) {
      console.error('Sayfalama parametreleri parse edilirken hata:', e);
      // Hata durumunda varsayılan değerleri kullan
      page = 0;
      limit = 10;
    }
    
    const offset = page * limit;

    // Arama parametreleri
    const search = req.query.search || '';
    const role = req.query.role || '';
    
    // Filtreleme koşulları - güvenli Sequelize ORM kullanımı (SQL injection korumalı)
    const whereCondition = {};
    
    // Arama filtresi - güvenli Sequelize operatörleri
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereCondition[Op.or] = [
        { first_name: { [Op.iLike]: `%${searchTerm}%` } },
        { last_name: { [Op.iLike]: `%${searchTerm}%` } },
        { email: { [Op.iLike]: `%${searchTerm}%` } },
        // Birleşik ad soyad araması için SQL CONCAT kullan
        sequelize.literal(`CONCAT(first_name, ' ', last_name) ILIKE :search`)
      ];
    }
    
    // Rol filtresi
    if (role && role.trim()) {
      whereCondition.role = role;
    }

    // Kullanıcıları getir (şifre hariç) - güvenli Sequelize ORM
    const { count: totalCount, rows: users } = await User.findAndCountAll({
      where: whereCondition,
      attributes: [
        'id', 
        'email', 
        ['first_name', 'firstName'], 
        ['last_name', 'lastName'], 
        'role', 
        'createdAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: offset,
      replacements: search ? { search: `%${search.trim()}%` } : {}
    });

    res.json({
      totalCount: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      users: users
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Kullanıcılar getirilirken hata oluştu', error: err.message });
  }
};

// Kullanıcı detayları endpoint'i
export const getUserById = async (req, res) => {
  try {
    // Sadece yöneticilerin erişebileceği kontrol edilmeli (middleware'de yapılacak)
    if (req.user.role !== 'Yonetici') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
    }

    const userId = req.params.id;
    
    // Kullanıcı bilgilerini getir (şifre hariç)
    const user = await User.findByPk(userId, {
      attributes: [
        'id', 
        'email', 
        ['first_name', 'firstName'], 
        ['last_name', 'lastName'], 
        'role', 
        'createdAt'
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Kullanıcıya ait raporları da getir
    const reports = await Report.findAll({
      where: { userId: userId },
      attributes: ['id', 'filePath', 'notes', 'status', 'createdAt']
    });

    res.json({
      user,
      reports
    });
  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({ message: 'Kullanıcı detayları getirilirken hata oluştu', error: err.message });
  }
};

// Yeni kullanıcı ekleme endpoint'i - GÜVENLİ VERSİYON
export const createUser = async (req, res) => {
  try {
    // Sadece yöneticilerin erişebileceği kontrol edilmeli (middleware'de yapılacak)
    if (req.user.role !== 'Yonetici') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
    }

    const { email, firstName, lastName, password, role } = req.body;

    // Input validation
    if (!email || !firstName || !lastName || !password || !role) {
      return res.status(400).json({ message: 'Tüm alanlar doldurulmalıdır' });
    }

    // Email format validation (authController ile aynı)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Geçerli bir email adresi giriniz' });
    }

    // Password validation (authController ile aynı)
    if (password.length < 8) {
      return res.status(400).json({ message: 'Şifre en az 8 karakter olmalıdır' });
    }
    if (password.length > 128) {
      return res.status(400).json({ message: 'Şifre en fazla 128 karakter olabilir' });
    }

    // Name validation (authController ile aynı)
    const validateName = (name) => {
      if (!name || typeof name !== 'string') {
        return { valid: false, message: 'İsim gereklidir' };
      }
      const trimmed = name.trim();
      if (trimmed.length < 2) {
        return { valid: false, message: 'İsim en az 2 karakter olmalıdır' };
      }
      if (trimmed.length > 50) {
        return { valid: false, message: 'İsim en fazla 50 karakter olabilir' };
      }
      return { valid: true, value: trimmed };
    };

    const firstNameValidation = validateName(firstName);
    if (!firstNameValidation.valid) {
      return res.status(400).json({ message: `Ad: ${firstNameValidation.message}` });
    }

    const lastNameValidation = validateName(lastName);
    if (!lastNameValidation.valid) {
      return res.status(400).json({ message: `Soyad: ${lastNameValidation.message}` });
    }

    // Email benzersizliği kontrolü (case-insensitive)
    const existingUser = await User.findOne({ 
      where: { email: email.toLowerCase() } 
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu email adresi zaten kullanılıyor' });
    }

    // Rol kontrolü
    const validRoles = ['Calisan', 'Yonetici'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Geçersiz rol' });
    }

    // Şifre hash'leme (authController ile aynı BCrypt rounds)
    const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Yeni kullanıcı oluşturma
    const newUser = await User.create({
      email: email.toLowerCase(), // Case-insensitive email
      firstName: firstNameValidation.value, // Trimmed name
      lastName: lastNameValidation.value, // Trimmed name
      passwordHash: hashedPassword,
      role,
      createdAt: new Date()
    });

    // Şifre olmadan kullanıcı bilgilerini döndür
    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      createdAt: newUser.createdAt
    });
  } catch (err) {
    console.error('Error creating user:', err.message);
    res.status(500).json({ message: 'Kullanıcı oluşturulurken hata oluştu' });
  }
};

// Kullanıcı güncelleme endpoint'i
export const updateUser = async (req, res) => {
  try {
    // Sadece yöneticilerin erişebileceği kontrol edilmeli (middleware'de yapılacak)
    if (req.user.role !== 'Yonetici') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
    }

    const userId = req.params.id;
    const { email, firstName, lastName, role, password } = req.body;

    // Input validation
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ message: 'Geçerli bir kullanıcı ID\'si gerekli' });
    }

    // Email validation
    if (email && typeof email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Geçerli bir email adresi giriniz' });
      }
    }

    // Name validation
    if (firstName && typeof firstName === 'string') {
      const trimmed = firstName.trim();
      if (trimmed.length < 2 || trimmed.length > 50) {
        return res.status(400).json({ message: 'Ad 2-50 karakter arasında olmalıdır' });
      }
    }

    if (lastName && typeof lastName === 'string') {
      const trimmed = lastName.trim();
      if (trimmed.length < 2 || trimmed.length > 50) {
        return res.status(400).json({ message: 'Soyad 2-50 karakter arasında olmalıdır' });
      }
    }

    // Role validation
    if (role && typeof role === 'string') {
      const validRoles = ['Calisan', 'Yonetici'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Geçersiz rol' });
      }
    }

    // Password validation
    if (password && typeof password === 'string') {
      if (password.length < 8 || password.length > 128) {
        return res.status(400).json({ message: 'Şifre 8-128 karakter arasında olmalıdır' });
      }
    }

    // Kullanıcı varlığı kontrolü
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Email değiştirilmek isteniyorsa benzersizlik kontrolü
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        return res.status(400).json({ message: 'Bu email adresi zaten kullanılıyor' });
      }
      user.email = email.toLowerCase(); // Case-insensitive
    }

    // Diğer alanları güncelle (trimmed)
    if (firstName && typeof firstName === 'string') {
      user.firstName = firstName.trim();
    }
    if (lastName && typeof lastName === 'string') {
      user.lastName = lastName.trim();
    }
    
    // Rol kontrolü ve güncelleme
    if (role) {
      const validRoles = ['Calisan', 'Yonetici'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Geçersiz rol' });
      }
      user.role = role;
    }

    // Şifre güncellemesi isteniyorsa
    if (password && typeof password === 'string') {
      const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
      user.passwordHash = hashedPassword;
    }

    // Kullanıcıyı kaydet
    await user.save();

    // Güncellenmiş kullanıcı bilgilerini döndür (şifre hariç)
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).json({ 
      message: 'Kullanıcı güncellenirken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Kullanıcı silme endpoint'i
export const deleteUser = async (req, res) => {
  try {
    // Sadece yöneticilerin erişebileceği kontrol edilmeli (middleware'de yapılacak)
    if (req.user.role !== 'Yonetici') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
    }

    const userId = req.params.id;

    // Kullanıcı varlığı kontrolü
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Kendini silmeye çalışıyor mu kontrolü
    if (userId === req.user.id.toString()) {
      return res.status(400).json({ message: 'Kendi hesabınızı silemezsiniz' });
    }

    // Kullanıcıya ait raporları bul ve sil
    const userReports = await Report.findAll({
      where: { userId: userId }
    });

    // Kullanıcı silinmeden önce raporlarını sil
    if (userReports.length > 0) {
      await Report.destroy({
        where: { userId: userId }
      });
      console.log(`${userReports.length} rapor silindi`);
    }

    // Kullanıcıya ait günlük uyarıları bul ve sil
    const userWarnings = await DailyWarning.findAll({
      where: { employeeId: userId }
    });

    // Kullanıcı silinmeden önce günlük uyarılarını sil
    if (userWarnings.length > 0) {
      await DailyWarning.destroy({
        where: { employeeId: userId }
      });
      console.log(`${userWarnings.length} günlük uyarı silindi`);
    }

    // Kullanıcıyı sil
    await user.destroy();

    // Başarılı yanıt döndür
    res.status(200).json({ message: 'Kullanıcı başarıyla silindi' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Kullanıcı silinirken hata oluştu', error: err.message });
  }
};

// Dashboard istatistikleri için optimize edilmiş fonksiyon
import { fn, col, literal } from 'sequelize';

export const getDashboardStats = async (req, res) => {
  try {
    // Yalnızca yöneticiler
    if (req.user.role !== 'Yonetici') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
    }

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1);

    // Optimized queries with better performance
    const [
      totalUsers,
      totalReports,
      thisMonthReports,
      pendingReports,
      statusStats,
      userReportStats,
      monthlyStatsRaw
    ] = await Promise.all([
      // Toplam çalışan sayısı - optimized
      User.count({ 
        where: { role: 'Calisan' },
        distinct: true
      }),

      // Toplam rapor sayısı - optimized
      Report.count(),

      // Bu ay yüklenen rapor sayısı - optimized
      Report.count({
        where: {
          created_at: { [Op.gte]: firstDayOfMonth }
        }
      }),

      // Bekleyen rapor sayısı - optimized
      Report.count({
        where: { status: 'Not Reviewed' }
      }),

      // Rapor durumu dağılımı - optimized
      Report.findAll({
        attributes: [
          'status',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['status'],
        raw: true // Better performance
      }),

      // Çalışan bazlı incelenmemiş rapor dağılımı - optimized
      User.findAll({
        where: { role: 'Calisan' },
        attributes: [
          'id', 'first_name', 'last_name',
          [fn('COUNT', col('Reports.id')), 'reportCount']
        ],
        include: [{
          model: Report,
          attributes: [],
          required: false,
          where: { status: 'Not Reviewed' }
        }],
        group: ['User.id'],
        raw: true // Better performance
      }),

      // Son 6 ay rapor yükleme verileri - optimized
      Report.findAll({
        attributes: [
          [fn('DATE_TRUNC', 'month', col('created_at')), 'month'],
          [fn('COUNT', col('id')), 'count']
        ],
        where: {
          created_at: { [Op.gte]: sixMonthsAgo }
        },
        group: [literal(`DATE_TRUNC('month', "created_at")`)],
        order: [[literal(`DATE_TRUNC('month', "created_at")`), 'ASC']],
        raw: true // Better performance
      })
    ]);

    // Sequelize'den gelen tarihleri locale uygun hale çevir - optimized
    const monthlyStats = monthlyStatsRaw.map(stat => ({
      month: new Date(stat.month).toLocaleString('tr-TR', { month: 'long' }),
      count: parseInt(stat.count)
    }));

    res.json({
      totalUsers,
      totalReports,
      thisMonthReports,
      pendingReports,
      statusStats,
      userReportStats,
      monthlyStats
    });

  } catch (err) {
    console.error('Error fetching dashboard stats:', err.message);
    res.status(500).json({
      message: 'Dashboard istatistikleri alınırken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


export const getRecentActivities = async (req, res) => {
  try {
    // Sadece yöneticilerin erişebileceği kontrol
    if (req.user.role !== 'Yonetici') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
    }

    // Son yüklenen raporları getir
    const recentReports = await Report.findAll({
      attributes: ['id', 'status', 'created_at'], // created_at alanını açıkça belirt
      include: [{
        model: User,
        attributes: ['first_name', 'last_name'] // Doğru sütun adlarını kullan
      }],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    res.json({
      recentReports
    });

  } catch (err) {
    console.error('Error fetching recent activities:', err);
    res.status(500).json({ message: 'Son aktiviteler alınırken hata oluştu', error: err.message });
  }
};

// Günlük rapor durumu için yeni fonksiyon
export const getDailyStatus = async (req, res) => {
  try {
    // Sadece yöneticilerin erişebileceği kontrol
    if (req.user.role !== 'Yonetici') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
    }

    // Bugünün tarihini al (Türkiye saati)
    const turkeyDate = new Date();
    turkeyDate.setHours(turkeyDate.getHours() + 3); // UTC+3 (Türkiye)
    
    // Bugün 09:00-18:00 arası
    const todayStart = new Date(turkeyDate);
    todayStart.setHours(9, 0, 0, 0);
    
    const todayEnd = new Date(turkeyDate);
    todayEnd.setHours(18, 0, 0, 0);

    // Bugün rapor yükleyen çalışanları bul
    const employeesWithReports = await Report.findAll({
      where: {
        created_at: {
          [Op.between]: [todayStart, todayEnd]
        }
      },
      include: [{
        model: User,
        where: { role: 'Calisan' },
        attributes: ['id', 'firstName', 'lastName']
      }],
      attributes: ['userId'],
      distinct: true
    });

    // Bugün rapor yükleyen çalışan ID'leri ve isimleri
    const reportedEmployees = employeesWithReports.map(report => ({
      id: report.userId,
      firstName: report.User.firstName,
      lastName: report.User.lastName
    }));

    // Bugün rapor yükleyen çalışan ID'leri
    const reportedUserIds = reportedEmployees.map(emp => emp.id);

    // Tüm çalışanları getir
    const allEmployees = await User.findAll({
      where: { role: 'Calisan' },
      attributes: ['id', 'firstName', 'lastName'],
      order: [['firstName', 'ASC']]
    });

    // Her çalışan için durum belirle
    const dailyStatus = allEmployees.map(employee => {
      const hasReported = reportedUserIds.includes(employee.id);
      const reportedEmployee = reportedEmployees.find(emp => emp.id === employee.id);
      
      return {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        hasReported: hasReported,
        status: hasReported ? 'reported' : 'not_reported'
      };
    });

    res.json({
      dailyStatus,
      totalEmployees: allEmployees.length,
      reportedToday: reportedUserIds.length,
      notReportedToday: allEmployees.length - reportedUserIds.length
    });

  } catch (err) {
    console.error('Error fetching daily status:', err);
    res.status(500).json({ message: 'Günlük durum alınırken hata oluştu', error: err.message });
  }
};

// ===== YENİ BİLDİRİM SİSTEMİ =====

// Günlük uyarıları oluştur (18:01'de çalışacak)
export const generateDailyWarnings = async (req, res) => {
  try {
    if (req.user.role !== 'Yonetici') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
    }

    // Bugünün tarihini al
    const today = new Date();
    const todayDate = today.toISOString().split('T')[0]; // YYYY-MM-DD formatı
    
    // Bugün için uyarı zaten var mı kontrol et
    const existingWarnings = await DailyWarning.findOne({
      where: { warningDate: todayDate }
    });

    if (existingWarnings) {
      return res.json({ message: 'Bugün için uyarılar zaten oluşturulmuş' });
    }

    // Bugün 09:00-18:00 arası
    const todayStart = new Date(today);
    todayStart.setHours(9, 0, 0, 0);
    
    const todayEnd = new Date(today);
    todayEnd.setHours(18, 0, 0, 0);

    // Bugün rapor yükleyen çalışanları bul
    const employeesWithReports = await Report.findAll({
      where: {
        created_at: {
          [Op.between]: [todayStart, todayEnd]
        }
      },
      include: [{
        model: User,
        where: { role: 'Calisan' },
        attributes: ['id', 'firstName', 'lastName']
      }],
      attributes: ['userId'],
      distinct: true
    });

    // Bugün rapor yükleyen çalışan ID'leri
    const reportedUserIds = employeesWithReports.map(report => report.userId);

    // Tüm çalışanları getir
    const allEmployees = await User.findAll({
      where: { role: 'Calisan' },
      attributes: ['id', 'firstName', 'lastName'],
      order: [['firstName', 'ASC']]
    });

    // Rapor yüklemeyen çalışanlar için uyarı oluştur
    const warningsToCreate = [];
    const currentTime = new Date();
    currentTime.setHours(18, 1, 0, 0); // 18:01

    for (const employee of allEmployees) {
      if (!reportedUserIds.includes(employee.id)) {
        warningsToCreate.push({
          employeeId: employee.id,
          warningDate: todayDate,
          warningTime: currentTime.toTimeString().slice(0, 5), // HH:MM formatı
          warningMessage: `${employee.firstName} ${employee.lastName} bugün rapor yüklemedi`,
          isRead: false,
          isSaved: false
        });
      }
    }

    if (warningsToCreate.length > 0) {
      await DailyWarning.bulkCreate(warningsToCreate);
      console.log(`${warningsToCreate.length} adet günlük uyarı oluşturuldu`);
    }

    res.json({ 
      message: 'Günlük uyarılar oluşturuldu',
      warningsCreated: warningsToCreate.length,
      date: todayDate
    });

  } catch (err) {
    console.error('Error generating daily warnings:', err);
    res.status(500).json({ message: 'Günlük uyarılar oluşturulurken hata oluştu', error: err.message });
  }
};

// Günlük uyarıları getir
export const getDailyWarnings = async (req, res) => {
  try {
    if (req.user.role !== 'Yonetici') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    // Toplam uyarı sayısını al
    const totalCount = await DailyWarning.count();

    // Uyarıları getir
    const warnings = await DailyWarning.findAll({
      include: [{
        model: User,
        as: 'employee',
        attributes: ['id', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset: offset
    });

    // Response formatını hazırla
    const formattedWarnings = warnings.map(warning => ({
      id: warning.id,
      message: warning.warningMessage,
      date: warning.warningDate,
      time: warning.warningTime,
      isRead: warning.isRead,
      isSaved: warning.isSaved,
      employeeName: `${warning.employee.firstName} ${warning.employee.lastName}`,
      createdAt: warning.createdAt
    }));

    res.json({
      warnings: formattedWarnings,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });

  } catch (err) {
    console.error('Error fetching daily warnings:', err);
    res.status(500).json({ message: 'Günlük uyarılar alınırken hata oluştu', error: err.message });
  }
  };
  
  // Kaydedilmiş uyarıları getir
  export const getSavedWarnings = async (req, res) => {
    try {
      if (req.user.role !== 'Yonetici') {
        return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
      }
  
      const { page = 1, pageSize = 10 } = req.query;
      const offset = (page - 1) * pageSize;
  
      // Kaydedilmiş uyarıları getir
      const { count, rows: warnings } = await DailyWarning.findAndCountAll({
        where: { isSaved: true },
        include: [
          {
            model: User,
            as: 'employee',
            attributes: ['firstName', 'lastName'],
            required: true
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(pageSize),
        offset: parseInt(offset)
      });
  
      // Uyarı verilerini formatla
      const formattedWarnings = warnings.map(warning => ({
        id: warning.id,
        employeeId: warning.employeeId,
        employeeName: `${warning.employee.firstName} ${warning.employee.lastName}`,
        warningDate: warning.warningDate,
        warningTime: warning.warningTime,
        warningMessage: warning.warningMessage,
        isRead: warning.isRead,
        isSaved: warning.isSaved,
        date: warning.warningDate,
        time: warning.warningTime,
        message: warning.warningMessage,
        createdAt: warning.createdAt,
        updatedAt: warning.updatedAt
      }));
  
      res.json({
        warnings: formattedWarnings,
        pagination: {
          currentPage: parseInt(page),
          pageSize: parseInt(pageSize),
          totalCount: count,
          totalPages: Math.ceil(count / pageSize)
        }
      });
    } catch (err) {
      console.error('Error fetching saved warnings:', err);
      res.status(500).json({ message: 'Kaydedilmiş uyarılar getirilirken hata oluştu', error: err.message });
    }
  };
  
  // Uyarıyı okundu olarak işaretle
export const markDailyWarningAsRead = async (req, res) => {
  try {
    if (req.user.role !== 'Yonetici') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
    }

    const { id } = req.params;
    const warning = await DailyWarning.findByPk(id);
    
    if (!warning) {
      return res.status(404).json({ message: 'Uyarı bulunamadı' });
    }

    // Mevcut durumun tersini yap (toggle)
    const newReadStatus = !warning.isRead;
    await warning.update({ isRead: newReadStatus });

    res.json({ 
      message: newReadStatus ? 'Uyarı okundu olarak işaretlendi' : 'Uyarı okunmadı olarak işaretlendi',
      isRead: newReadStatus 
    });

  } catch (err) {
    console.error('Error marking warning as read:', err);
    res.status(500).json({ message: 'Uyarı durumu güncellenirken hata oluştu', error: err.message });
  }
};

// Uyarıyı kaydet
export const saveDailyWarning = async (req, res) => {
  try {
    if (req.user.role !== 'Yonetici') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
    }

    const { id } = req.params;
    const { notes } = req.body;
    
    const warning = await DailyWarning.findByPk(id);
    if (!warning) {
      return res.status(404).json({ message: 'Uyarı bulunamadı' });
    }

    await warning.update({ isSaved: true, isRead: true });
    res.json({ message: 'Uyarı kaydedildi ve okundu olarak işaretlendi' });

  } catch (err) {
    console.error('Error saving warning:', err);
    res.status(500).json({ message: 'Uyarı kaydedilirken hata oluştu', error: err.message });
  }
};

// Uyarıyı kayıttan çıkar
export const unsaveDailyWarning = async (req, res) => {
  try {
    if (req.user.role !== 'Yonetici') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
    }

    const { id } = req.params;
    
    const warning = await DailyWarning.findByPk(id);
    if (!warning) {
      return res.status(404).json({ message: 'Uyarı bulunamadı' });
    }

    await warning.update({ isSaved: false });
    res.json({ message: 'Uyarı kayıttan çıkarıldı' });

  } catch (err) {
    console.error('Error unsaving warning:', err);
    res.status(500).json({ message: 'Uyarı kayıttan çıkarılırken hata oluştu', error: err.message });
  }
};

// Uyarıyı sil
export const deleteDailyWarning = async (req, res) => {
  try {
    if (req.user.role !== 'Yonetici') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
    }

    const { id } = req.params;
    const warning = await DailyWarning.findByPk(id);
    
    if (!warning) {
      return res.status(404).json({ message: 'Uyarı bulunamadı' });
    }

    await warning.destroy();
    res.json({ message: 'Uyarı silindi' });

  } catch (err) {
    console.error('Error deleting warning:', err);
    res.status(500).json({ message: 'Uyarı silinirken hata oluştu', error: err.message });
  }
};













