import { Roles } from '../constants/roles';
import { AppointmentModel } from '../models/Appointment.model';
import { BillingModel } from '../models/Billing.model';
import { DoctorModel } from '../models/Doctor.model';
import { InventoryItemModel } from '../models/InventoryItem.model';
import { PatientModel } from '../models/Patient.model';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

const arabicDayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const arabicMonthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const appointmentStatuses = ['pending', 'confirmed', 'completed', 'cancelled'] as const;

type AppointmentStatus = (typeof appointmentStatuses)[number];

const startOfDay = (date: Date) => {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
};

const endOfDay = (date: Date) => {
  const clone = new Date(date);
  clone.setHours(23, 59, 59, 999);
  return clone;
};

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

const buildLast7Days = () => {
  const today = startOfDay(new Date());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return date;
  });
};

const buildLast6Months = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return date;
  });
};

const getDoctorDisplayName = (doctor: any) => {
  if (!doctor) return undefined;
  if (doctor.name) return doctor.name;
  if (doctor.user && typeof doctor.user === 'object') return doctor.user.name;
  return undefined;
};

const mapAppointmentPerson = (person: any, fallbackName?: string) => {
  if (!person) return null;
  return {
    _id: String(person._id),
    name: person.fullName ?? fallbackName ?? person.name,
    user: person.user && typeof person.user === 'object'
      ? {
          _id: String(person.user._id),
          name: person.user.name,
          email: person.user.email,
          phone: person.user.phone
        }
      : person.user
  };
};

export const getDashboardOverview = asyncHandler(async (_req, res) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const last7Days = buildLast7Days();
  const last7Start = last7Days[0];
  const last6Months = buildLast6Months();
  const revenueStart = last6Months[0];

  const [
    totalPatients,
    todayAppointments,
    pendingBillsAggregation,
    activeDoctorsCount,
    totalDoctors,
    appointmentStatusAggregation,
    appointmentsLast7DaysAggregation,
    monthlyRevenueAggregation,
    inventoryAlerts,
    latestAppointments
  ] = await Promise.all([
    PatientModel.countDocuments({ archived: false }),
    AppointmentModel.countDocuments({ scheduledAt: { $gte: todayStart, $lte: todayEnd } }),
    BillingModel.aggregate<{ _id: null; count: number; amount: number }>([
      { $match: { status: 'unpaid' } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$total' } } }
    ]),
    DoctorModel.countDocuments({ available: true }),
    DoctorModel.countDocuments(),
    AppointmentModel.aggregate<{ _id: AppointmentStatus; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    AppointmentModel.aggregate<{ _id: string; count: number }>([
      { $match: { scheduledAt: { $gte: last7Start, $lte: todayEnd } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$scheduledAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    BillingModel.aggregate<{ _id: { year: number; month: number }; amount: number }>([
      { $match: { status: 'paid' } },
      { $addFields: { revenueDate: { $ifNull: ['$paidAt', '$updatedAt'] } } },
      { $match: { revenueDate: { $gte: revenueStart } } },
      { $group: { _id: { year: { $year: '$revenueDate' }, month: { $month: '$revenueDate' } }, amount: { $sum: '$total' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),
    InventoryItemModel.find({ $expr: { $lte: ['$quantity', '$minimumQuantity'] } })
      .populate('medicine')
      .sort({ quantity: 1 })
      .limit(10)
      .lean(),
    AppointmentModel.find()
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email phone' } })
      .sort({ scheduledAt: -1 })
      .limit(5)
      .lean()
  ]);

  const pendingBills = pendingBillsAggregation[0] ?? { count: 0, amount: 0 };

  const appointmentStatus = appointmentStatuses.reduce<Record<AppointmentStatus, number>>((acc, status) => {
    acc[status] = appointmentStatusAggregation.find((item) => item._id === status)?.count ?? 0;
    return acc;
  }, { pending: 0, confirmed: 0, completed: 0, cancelled: 0 });

  const last7Map = new Map(appointmentsLast7DaysAggregation.map((item) => [item._id, item.count]));
  const appointmentsLast7Days = last7Days.map((date) => ({
    date: formatDateKey(date),
    day: arabicDayNames[date.getDay()],
    count: last7Map.get(formatDateKey(date)) ?? 0
  }));

  const revenueMap = new Map(
    monthlyRevenueAggregation.map((item) => [`${item._id.year}-${String(item._id.month).padStart(2, '0')}`, item.amount])
  );
  const monthlyRevenue = last6Months.map((date) => {
    const monthNumber = date.getMonth() + 1;
    const key = `${date.getFullYear()}-${String(monthNumber).padStart(2, '0')}`;
    return {
      year: date.getFullYear(),
      month: monthNumber,
      monthName: arabicMonthNames[date.getMonth()],
      amount: revenueMap.get(key) ?? 0
    };
  });

  const mappedInventoryAlerts = inventoryAlerts.map((item: any) => ({
    _id: String(item._id),
    name: item.medicine?.name ?? 'Unknown item',
    medicine: item.medicine
      ? {
          _id: String(item.medicine._id),
          name: item.medicine.name,
          code: item.medicine.code,
          unit: item.medicine.unit
        }
      : undefined,
    quantity: item.quantity,
    minimumQuantity: item.minimumQuantity,
    batchNumber: item.batchNumber,
    expiryDate: item.expiryDate,
    location: item.location,
    type: 'medicine'
  }));

  const mappedLatestAppointments = latestAppointments.map((appointment: any) => ({
    _id: String(appointment._id),
    patient: mapAppointmentPerson(appointment.patient),
    doctor: appointment.doctor
      ? {
          _id: String(appointment.doctor._id),
          name: getDoctorDisplayName(appointment.doctor),
          user: appointment.doctor.user && typeof appointment.doctor.user === 'object'
            ? {
                _id: String(appointment.doctor.user._id),
                name: appointment.doctor.user.name,
                email: appointment.doctor.user.email,
                phone: appointment.doctor.user.phone
              }
            : appointment.doctor.user,
          specialization: appointment.doctor.specialization,
          roomNumber: appointment.doctor.roomNumber
        }
      : null,
    scheduledAt: appointment.scheduledAt,
    durationMinutes: appointment.durationMinutes,
    reason: appointment.reason,
    status: appointment.status
  }));

  return sendSuccess(
    res,
    {
      summary: {
        totalPatients,
        todayAppointments,
        pendingBills: {
          count: pendingBills.count,
          amount: pendingBills.amount
        },
        activeDoctors: {
          count: activeDoctorsCount,
          total: totalDoctors
        }
      },
      appointmentStatus,
      appointmentsLast7Days,
      monthlyRevenue,
      inventoryAlerts: mappedInventoryAlerts,
      latestAppointments: mappedLatestAppointments
    },
    'Dashboard overview'
  );
});
