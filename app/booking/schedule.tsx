import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import PrimaryButton from '../../components/PrimaryButton';
import ErrorModal from '../../components/ui/ErrorModal';
import { bookingApi, Stylist } from '../../src/services/bookingApi';
import { API_BASE_URL } from '../../src/services/apiClient';
import { useAuthStore } from '../../src/stores/useAuthStore';

import { useCheckoutStore } from '../../src/stores/useCheckoutStore';

/**
 * ------------------------------------------------------------------
 *  LỊCH HẸN — CHỌN KHUNG GIỜ + CHỌN STYLIST
 * ------------------------------------------------------------------
 */

// ---------- Responsive scale helper ----------
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const MAX_CONTENT_WIDTH = 480;
const clampedWidth = Math.min(SCREEN_WIDTH, MAX_CONTENT_WIDTH);
const scale = (size: number) => Math.round((clampedWidth / BASE_WIDTH) * size);

const COLORS = {
  bg: '#F8F8F8',
  white: '#FFFFFF',
  black: '#000000',
  text: '#000000',
  muted: '#5C5C5C',
  inputBorder: '#505050',
  noteBorder: '#D9D9D9',
  imagePlaceholder: '#E8E8E8',
};

const FONT = {
  labelBold: 'Inter_600SemiBold',
  labelRegular: 'Inconsolata_400Regular',
  body: 'Inter_400Regular',
  bodyBold: 'Inter_600SemiBold',
  jaldi: 'Inter_400Regular',
  plexBold: 'Inter_600SemiBold',
  plexRegular: 'Inter_400Regular',
};

// ---------- Helpers ----------
const getImageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return encodeURI(path);
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${encodeURI(safePath)}`;
};

const getNext7Days = () => {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
};

const generateTimeSlots = (selectedDate: Date) => {
  const slots: string[] = [];
  const now = new Date();

  // Create Date objects at midnight for comparison to ignore time components
  const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const isToday = selectedDay.getTime() === today.getTime();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute + 30; // 30 minutes buffer

  for (let h = 8; h <= 20; h++) {
    const slot1Time = h * 60;
    const slot2Time = h * 60 + 30;

    if (!isToday || slot1Time > currentTimeInMinutes) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
    }
    if (!isToday || slot2Time > currentTimeInMinutes) {
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
  }
  return slots;
};

const formatDateUI = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
const formatApiDate = (d: Date) => `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;

const addMinutesToTime = (time: string, minutesToAdd: number) => {
  if (!time) return '--:--';
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutesToAdd;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`;
};

const formatPrice = (price: number) => price.toLocaleString('vi-VN') + 'đ';

// =====================================================================
// Shared Visual Components
// =====================================================================
function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <View style={styles.stepRow}>
      {[1, 2, 3].map((step, idx) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <React.Fragment key={step}>
            <View
              style={[
                styles.stepCircle,
                isActive && styles.stepCircleActive,
                isCompleted && styles.stepCircleCompleted
              ]}
            >
              {isCompleted ? (
                <Feather name="check" size={scale(20)} color={COLORS.white} />
              ) : (
                <Text style={[styles.stepCircleText, isActive && styles.stepCircleTextActive]}>
                  {step}
                </Text>
              )}
            </View>
            {idx < 2 && <View style={styles.stepLine} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function SummaryField({
  icon,
  label,
  value,
  onPress,
  style,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
  style?: any;
}) {
  return (
    <Pressable style={[styles.summaryField, style]} onPress={onPress}>
      <View style={styles.summaryFieldTopRow}>
        <Feather name={icon} size={scale(12)} color={COLORS.black} />
        <Text style={styles.summaryFieldLabel}>{label}</Text>
      </View>
      <View style={styles.summaryFieldDivider} />
      <Text style={styles.summaryFieldValue}>{value}</Text>
    </Pressable>
  );
}

// =====================================================================
// MAIN SCREEN
// =====================================================================
export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cartItems, selectedServices, setBookingData } = useCheckoutStore();
  const user = useAuthStore(state => state.user);

  const totalDurationMinutes = selectedServices.reduce((sum, s) => sum + s.duration, 0) || 60;
  const servicesSubtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const productsSubtotal = cartItems.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const grandTotal = servicesSubtotal + productsSubtotal;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const days = useMemo(() => getNext7Days(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(days[0]);
  const timeSlots = useMemo(() => generateTimeSlots(selectedDate), [selectedDate]);

  const [selectedTime, setSelectedTime] = useState<string>('09:00');

  // Adjust selectedTime if the current selectedTime is not in the newly generated timeSlots
  useEffect(() => {
    if (timeSlots.length > 0 && !timeSlots.includes(selectedTime)) {
      setSelectedTime(timeSlots[0]);
    }
  }, [timeSlots, selectedTime]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(true);

  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [selectedStylist, setSelectedStylist] = useState<string | null>(null); // null = "Tự bố trí"

  const expectedFinishTime = useMemo(
    () => addMinutesToTime(selectedTime, totalDurationMinutes),
    [selectedTime, totalDurationMinutes]
  );

  // Fetch Available Stylists when date/time changes
  useEffect(() => {
    fetchStylists();
  }, [selectedDate, selectedTime]);

  const fetchStylists = async () => {
    if (!selectedTime || !selectedDate) return;

    try {
      setLoading(true);
      const payload = {
        NgayHen: formatApiDate(selectedDate),
        GioBatDau: selectedTime + ':00', // BE expects HH:MM:SS
        TongThoiGian: totalDurationMinutes,
        MaKh: user?.maKH || 'GUEST'
      };

      // bookingApi.getAvailableStylists đã return response.data rồi
      // => KHÔNG được truy cập .data lần nữa
      const data = await bookingApi.getAvailableStylists(payload);

      const newStylists: Stylist[] = Array.isArray(data) ? data : [];
      setStylists(newStylists);

      if (selectedStylist && !newStylists.find(s => s.id === selectedStylist && s.isAvailable !== false)) {
        setSelectedStylist(null);
      }
    } catch (error: any) {
      console.log('Error fetching stylists:', error);
      if (error.response) {
        console.log('BE Error Response:', error.response.data);
      }
      setStylists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedTime) {
      setErrorMsg('Vui lòng chọn giờ hẹn.');
      return;
    }

    // Gửi tiếp dữ liệu sang Step 3 (Payment)
    setBookingData(formatApiDate(selectedDate), selectedTime, selectedStylist || undefined);

    router.push({
      pathname: '/booking/payment'
    });
  };

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBackBtn} hitSlop={12}>
          <Feather name="arrow-left" size={scale(22)} color={COLORS.black} />
        </Pressable>
        <Text style={styles.headerTitle}>LỊCH HẸN</Text>
        <View style={{ width: scale(22) }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: scale(140) + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centeredContent}>
          <StepIndicator currentStep={2} />

          {/* ------------------ CHỌN KHUNG GIỜ ------------------ */}
          <Animated.View entering={FadeInDown} style={styles.card}>
            <Text style={styles.cardTitleLeft}>CHỌN KHUNG GIỜ</Text>

            <View style={styles.summaryFieldsRow}>
              <SummaryField
                icon="calendar"
                label="NGÀY HẸN"
                value={formatDateUI(selectedDate)}
                onPress={() => setShowDatePicker(v => !v)}
                style={{ flex: 1.4 }}
              />
              <SummaryField
                icon="clock"
                label="GIỜ HẸN"
                value={selectedTime}
                onPress={() => setShowTimePicker(v => !v)}
                style={{ flex: 1 }}
              />
            </View>

            {showDatePicker && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dateScroll}
                contentContainerStyle={{ gap: scale(8) }}
              >
                {days.map((d, i) => {
                  const isSelected = d.toDateString() === selectedDate.toDateString();
                  const dayName = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
                  return (
                    <Pressable
                      key={i}
                      style={[styles.dateChip, isSelected && styles.dateChipActive]}
                      onPress={() => setSelectedDate(d)}
                    >
                      <Text style={[styles.dateChipDay, isSelected && styles.textWhite]}>{dayName}</Text>
                      <Text style={[styles.dateChipDate, isSelected && styles.textWhite]}>
                        {d.getDate()}/{d.getMonth() + 1}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {showTimePicker && (
              <View style={styles.timeGrid}>
                {timeSlots.map(t => {
                  const isSelected = selectedTime === t;
                  return (
                    <Pressable
                      key={t}
                      style={[styles.timeSlot, isSelected && styles.timeSlotActive]}
                      onPress={() => setSelectedTime(t)}
                    >
                      <Text style={[styles.timeSlotText, isSelected && styles.textWhite]}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Duration summary */}
            <View style={styles.durationBox}>
              <View style={styles.durationRow}>
                <Text style={styles.durationLabel}>Giờ bắt đầu</Text>
                <Text style={styles.durationValueSmall}>{selectedTime}</Text>
              </View>
              <View style={styles.durationRow}>
                <Text style={styles.durationLabel}>Dự kiến xong lúc</Text>
                <Text style={styles.durationValueBold}>{expectedFinishTime}</Text>
              </View>
              <View style={styles.durationRow}>
                <Text style={styles.durationLabel}>Tổng thời gian làm</Text>
                <Text style={styles.durationValueRegular}>{totalDurationMinutes} Phút</Text>
              </View>
            </View>
          </Animated.View>

          {/* ------------------ CHỌN STYLIST ------------------ */}
          <Animated.View entering={FadeInDown.delay(60)} style={[styles.card, { marginTop: scale(20) }]}>
            <View style={styles.stylistHeaderRow}>
              <Text style={styles.cardTitleCenter}>CHỌN STYLIST</Text>
              <Pressable
                style={[styles.autoAssignBtn, selectedStylist === null && styles.autoAssignBtnActive]}
                onPress={() => setSelectedStylist(null)}
              >
                <Text style={[styles.autoAssignText, selectedStylist === null && styles.textWhite]}>Tự bố trí</Text>
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color={COLORS.black} style={{ marginVertical: scale(20) }} />
            ) : stylists.length === 0 ? (
              <Text style={styles.noteBoxText}>Không có stylist nào trống lịch vào khung giờ này.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stylistListRow}
              >
                {stylists.map(s => {
                  const isAvailable = s.isAvailable !== false;
                  const isSelected = selectedStylist === s.id && isAvailable;
                  const imageUrl = getImageUrl(s.img);
                  return (
                    <Pressable
                      key={s.id}
                      style={[styles.stylistCol, !isAvailable && { opacity: 0.5 }]}
                      onPress={() => {
                        if (isAvailable) {
                          setSelectedStylist(s.id);
                        } else {
                          setErrorMsg(s.unAvailableReason || 'Stylist đang bận hoặc trái ca vào lúc này.');
                        }
                      }}
                    >
                      <View style={[styles.stylistAvatarWrap, isSelected && styles.stylistAvatarWrapActive]}>
                        {s.img ? (
                          <Image source={{ uri: imageUrl }} style={styles.stylistAvatar} contentFit="cover" />
                        ) : (
                          <View style={[styles.stylistAvatar, { backgroundColor: COLORS.imagePlaceholder, justifyContent: 'center', alignItems: 'center' }]}>
                            <Feather name="user" size={scale(28)} color={COLORS.muted} />
                          </View>
                        )}
                        {s.isFavorite && (
                          <View style={styles.favoriteBadge}>
                            <Feather name="heart" size={scale(10)} color={COLORS.white} />
                          </View>
                        )}
                      </View>
                      <Text style={styles.stylistName} numberOfLines={1}>{s.name}</Text>
                      {!isAvailable && (
                        <Text style={styles.stylistReason} numberOfLines={2}>{s.unAvailableReason}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.noteBox}>
              <Feather name="info" size={scale(13)} color={COLORS.black} />
              <Text style={styles.noteBoxText}>
                Salon sẽ bố trí thợ phù hợp nhất theo dịch vụ bạn chọn
              </Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Fixed footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, scale(12)) }]}>
        <View style={styles.centeredContent}>
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.footerLabel}>TẠM TÍNH</Text>
              <Text style={styles.footerAmount}>{formatPrice(grandTotal)}</Text>
            </View>
            <PrimaryButton title="TIẾP TỤC" onPress={handleContinue} style={styles.footerBtn} />
          </View>
        </View>
      </View>

      <ErrorModal visible={!!errorMsg} message={errorMsg} onClose={() => setErrorMsg('')} />
    </>
  );
}

// =====================================================================
// Styles
// =====================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingTop: scale(4) },
  centeredContent: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: scale(16),
  },

  // Header
  header: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerBackBtn: { padding: scale(4) },
  headerTitle: {
    fontFamily: FONT.labelBold,
    fontSize: scale(18),
    color: COLORS.black,
    textAlign: 'center',
  },

  // Step indicator
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(24),
  },
  stepCircle: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: COLORS.black, borderColor: COLORS.black },
  stepCircleCompleted: { backgroundColor: '#00C800', borderColor: '#00C800' }, // Green checkmark circle
  stepCircleText: { fontFamily: FONT.body, fontSize: scale(16), color: COLORS.black },
  stepCircleTextActive: { color: COLORS.white },
  stepLine: {
    width: scale(27),
    height: 1,
    backgroundColor: COLORS.inputBorder,
    marginHorizontal: scale(6),
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 4,
    padding: scale(16),
  },
  cardTitleLeft: {
    fontFamily: FONT.labelBold,
    fontSize: scale(16),
    color: COLORS.black,
    marginBottom: scale(16),
  },
  cardTitleCenter: {
    fontFamily: FONT.labelBold,
    fontSize: scale(16),
    color: COLORS.black,
  },

  // Date/Time summary fields
  summaryFieldsRow: {
    flexDirection: 'row',
    gap: scale(12),
  },
  summaryField: {
    height: scale(65),
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 4,
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    justifyContent: 'space-between',
  },
  summaryFieldTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  summaryFieldLabel: {
    fontFamily: FONT.jaldi,
    fontSize: scale(13),
    color: COLORS.black,
    letterSpacing: 0.3,
  },
  summaryFieldDivider: {
    height: 1,
    backgroundColor: COLORS.inputBorder,
    opacity: 0.5,
    marginVertical: scale(4),
  },
  summaryFieldValue: {
    fontFamily: FONT.labelRegular,
    fontSize: scale(16),
    color: COLORS.black,
    textAlign: 'center',
  },

  // Date picker strip
  dateScroll: {
    marginTop: scale(12),
  },
  dateChip: {
    width: scale(52),
    height: scale(56),
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  dateChipActive: { backgroundColor: COLORS.black, borderColor: COLORS.black },
  dateChipDay: { fontFamily: FONT.labelRegular, fontSize: scale(13), color: COLORS.black },
  dateChipDate: { fontFamily: FONT.labelRegular, fontSize: scale(14), color: COLORS.black, marginTop: scale(2) },

  // Time grid
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    marginTop: scale(16),
  },
  timeSlot: {
    width: '23%',
    height: scale(29),
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  timeSlotActive: { backgroundColor: COLORS.black, borderColor: COLORS.black },
  timeSlotText: { fontFamily: FONT.labelRegular, fontSize: scale(14), color: COLORS.black },

  // Duration box
  durationBox: {
    marginTop: scale(16),
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 4,
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    gap: scale(10),
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationLabel: {
    fontFamily: FONT.labelRegular,
    fontSize: scale(14),
    color: COLORS.black,
  },
  durationValueSmall: {
    fontFamily: FONT.labelRegular,
    fontSize: scale(13),
    color: COLORS.black,
  },
  durationValueBold: {
    fontFamily: FONT.plexBold,
    fontSize: scale(15),
    fontWeight: '700',
    color: COLORS.black,
  },
  durationValueRegular: {
    fontFamily: FONT.plexRegular,
    fontSize: scale(13),
    color: COLORS.black,
  },

  // Stylist section
  stylistHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(16),
    position: 'relative',
  },
  autoAssignBtn: {
    position: 'absolute',
    right: 0,
    height: scale(25),
    paddingHorizontal: scale(14),
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  autoAssignBtnActive: { backgroundColor: COLORS.black },
  autoAssignText: { fontFamily: FONT.labelRegular, fontSize: scale(14), color: COLORS.black },

  stylistListRow: {
    gap: scale(14),
    paddingTop: scale(4),
    paddingBottom: scale(8),
  },
  stylistCol: {
    alignItems: 'center',
    width: scale(99),
  },
  stylistAvatarWrap: {
    width: scale(99),
    height: scale(130),
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stylistAvatarWrapActive: { borderColor: COLORS.black },
  stylistAvatar: { width: '100%', height: '100%' },
  stylistName: {
    fontFamily: FONT.body,
    fontSize: scale(13),
    color: COLORS.black,
    marginTop: scale(8),
    textAlign: 'center',
  },
  stylistReason: {
    fontFamily: FONT.body,
    fontSize: scale(10),
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: scale(4),
  },
  favoriteBadge: {
    position: 'absolute',
    top: scale(4),
    right: scale(4),
    backgroundColor: '#FF3B30',
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Note box
  noteBox: {
    marginTop: scale(12),
    borderWidth: 1,
    borderColor: COLORS.noteBorder,
    borderRadius: 4,
    minHeight: scale(38),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
  },
  noteBoxText: {
    flex: 1,
    fontFamily: FONT.body,
    fontSize: scale(13),
    color: COLORS.black,
  },

  textWhite: { color: COLORS.white },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.black,
    paddingTop: scale(14),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLabel: { fontFamily: FONT.labelRegular, fontSize: scale(16), color: COLORS.black },
  footerAmount: { fontFamily: FONT.labelRegular, fontSize: scale(18), color: COLORS.black, marginTop: scale(4) },
  footerBtn: { width: scale(138), height: scale(43), borderRadius: 0 },
});
