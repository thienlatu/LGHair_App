import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { userApi } from '../../src/services/userApi';
import { ActivityIndicator } from 'react-native';

import { useDataStore } from '../../src/stores/useDataStore';
import { getImageUrl } from '../../src/utils/imageUtils';



/**
 * ------------------------------------------------------------------
 *  CHI TIẾT HÓA ĐƠN (Invoice Detail)
 *  Rebuilt 1:1 from Figma:
 *  https://www.figma.com/design/R5mRIA2jgnQBjTskNsRtxd/Untitled?node-id=215-217
 *
 *  Detail view opened from a card on the "Lịch sử hóa đơn" screen.
 *  Rebuilt with a single scrollable flexbox card (instead of the
 *  fixed y-offset nodes from the Figma frame) so it holds on any
 *  device width/height regardless of how many service lines or
 *  stylists there are.
 *
 *  Visual tokens from the node tree: bg #F8F8F8, card white rounded
 *  12, status badge border #B9FFAA / text #36830D ("Hoàn thành"),
 *  nested payment-breakdown box border #DDD, black "TỔNG" bar with
 *  white text, paid-installment amounts in black with the
 *  "Đã thanh toán" suffix in green (#1E981A). "Inconsolata" for
 *  titles/labels, "Inter" for service line items, "Inclusive Sans"
 *  for the payment-breakdown numbers, "Gideon Roman" for stylist
 *  names under their avatars (falls back to System if not bundled).
 * ------------------------------------------------------------------
 */

// ---------- Responsive scale helper (base design width = 390) ----------
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const MAX_CONTENT_WIDTH = 480;
const clampedWidth = Math.min(SCREEN_WIDTH, MAX_CONTENT_WIDTH);
const scale = (size: number) => Math.round((clampedWidth / BASE_WIDTH) * size);

const COLORS = {
    bg: '#F8F8F8',
    white: '#FFFFFF',
    black: '#000000',
    muted: '#5C5C5C',
    divider: '#EFEFEF',
    boxBorder: '#DDDDDD',
    paidGreen: '#1E981A',
    statusBorder: '#B9FFAA',
    statusText: '#36830D',
    imagePlaceholder: '#E8E8E8',
};

const FONT = {
    labelBold: Platform.select({ ios: 'Inconsolata-SemiBold', android: 'Inconsolata_600SemiBold', default: 'System' }),
    labelRegular: Platform.select({ ios: 'Inconsolata-Regular', android: 'Inconsolata_400Regular', default: 'System' }),
    body: Platform.select({ ios: 'Inter-Regular', android: 'Inter_400Regular', default: 'System' }),
    inclusive: Platform.select({ ios: 'InclusiveSans-Regular', android: 'InclusiveSans_400Regular', default: 'System' }),
    gideon: Platform.select({ ios: 'GideonRoman-Regular', android: 'GideonRoman_400Regular', default: 'System' }),
};

const formatPrice = (price: number) => Math.round(price).toLocaleString('vi-VN') + 'đ';

// ---------- Types ----------
interface ServiceLine {
    id: string;
    name: string;
    price: number;
    image?: string;
}

interface StylistInfo {
    id: string;
    name: string;
    avatar?: string;
}

interface Installment {
    label: string;
    amount: number;
    paid: boolean;
}

interface InvoiceDetailData {
    orderCode: string;
    status: string;
    serviceCount: number;
    totalServiceAmount: number;
    orderDate: string;
    services: ServiceLine[];
    stylists: StylistInfo[];
    servicesSubtotal: number;

    totalDiscount: number;
    grandTotal: number;
    dueAtStore: number;
    installments: Installment[];
}

const PLACEHOLDER_IMG = 'https://www.figma.com/api/mcp/asset/aa6c3758-5404-4007-bc45-bc8fafa280cc';
const PLACEHOLDER_AVATAR = 'https://www.figma.com/api/mcp/asset/f49d85af-5bd0-461a-8151-fa9a7d5d091d';

// TODO: replace with real invoice-detail API data (fetched by orderCode)
// Removed default invoice

// =====================================================================
// Service line row
// =====================================================================
function ServiceLineRow({ item }: { item: ServiceLine }) {
    const [imgError, setImgError] = useState(false);
    return (
        <View style={styles.serviceRow}>
            <View style={styles.serviceThumbWrap}>
                {(!item.image || imgError) ? (
                    <View style={[styles.serviceThumb, { backgroundColor: COLORS.imagePlaceholder, justifyContent: 'center', alignItems: 'center' }]}>
                        <Feather name="image" size={16} color={COLORS.muted} />
                    </View>
                ) : (
                    <Image source={{ uri: item.image }} style={styles.serviceThumb} contentFit="cover" onError={() => setImgError(true)} />
                )}
            </View>
            <Text style={styles.serviceName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.servicePrice}>{formatPrice(item.price)}</Text>
        </View>
    );
}

function StylistAvatar({ st }: { st: StylistInfo }) {
    const [imgError, setImgError] = useState(false);
    return (
        <View style={styles.stylistCol}>
            <View style={styles.stylistAvatarWrap}>
                {(!st.avatar || imgError) ? (
                    <View style={[styles.stylistAvatar, { backgroundColor: COLORS.imagePlaceholder, justifyContent: 'center', alignItems: 'center' }]}>
                        <Feather name="user" size={24} color={COLORS.muted} />
                    </View>
                ) : (
                    <Image source={{ uri: st.avatar }} style={styles.stylistAvatar} contentFit="cover" onError={() => setImgError(true)} />
                )}
            </View>
            <Text style={styles.stylistName} numberOfLines={1}>{st.name}</Text>
        </View>
    );
}

// =====================================================================
// Key/value info line ("Tổng dịch vụ : x3" style, dotted alignment
// via space-between rather than the manual spaces used in Figma)
// =====================================================================
function InfoLine({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.infoLineRow}>
            <Text style={styles.infoLineLabel}>{label}</Text>
            <Text style={styles.infoLineValue}>{value}</Text>
        </View>
    );
}

function BreakdownLine({ label, value, small }: { label: string; value: string; small?: boolean }) {
    return (
        <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, small && styles.breakdownLabelSmall]}>{label}</Text>
            <Text style={styles.breakdownValue}>{value}</Text>
        </View>
    );
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Đã hủy':
            return { borderColor: '#FFB3B3', color: '#D20E18' };
        case 'Chờ xử lý':
            return { borderColor: '#FFE5B4', color: '#D97706' };
        case 'Đã trả 100%':
            return { borderColor: '#2196F3', color: '#1976D2' };
        case 'Hoàn thành':
        default:
            return { borderColor: COLORS.statusBorder, color: COLORS.statusText };
    }
};

// =====================================================================
// MAIN SCREEN
// =====================================================================
export default function InvoiceDetailScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [invoice, setInvoice] = useState<InvoiceDetailData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchDetail = async () => {
            try {
                setLoading(true);
                const data = await userApi.getBookingDetail(id);

                const globalServices = useDataStore.getState().SERVICES;
                const globalCombos = useDataStore.getState().COMBOS;

                const services: ServiceLine[] = data.items.map((it: any, idx: number) => {
                    let imageUrl = it.hinhAnh ? getImageUrl(it.hinhAnh) : undefined;

                    if (!imageUrl) {
                        const matchedService = globalServices.find(s => s.maDv === it.maDv || s.tenDv === it.name);
                        if (matchedService) {
                            if (matchedService.hinhAnh) {
                                imageUrl = getImageUrl(matchedService.hinhAnh);
                            } else if (matchedService.hinhAnhs && matchedService.hinhAnhs.length > 0) {
                                imageUrl = getImageUrl(matchedService.hinhAnhs[0].duongDan);
                            }
                        } else {
                            const matchedCombo = globalCombos.find((c: any) => c.id === it.maDv || c.tenCombo === it.name || c.id === it.id || c.name === it.name);
                            if (matchedCombo && matchedCombo.hinhAnh) {
                                imageUrl = getImageUrl(matchedCombo.hinhAnh);
                            }
                        }
                    }

                    return {
                        id: `s${idx}`,
                        name: it.name,
                        price: it.price,
                        image: imageUrl
                    };
                });

                // Group by stylistName to get the first available avatar
                const stylistsMap = new Map<string, string>();
                data.items.forEach((it: any) => {
                    if (it.stylistName && !stylistsMap.has(it.stylistName)) {
                        stylistsMap.set(it.stylistName, it.stylistAvatar ? getImageUrl(it.stylistAvatar) : '');
                    }
                });

                const stylists: StylistInfo[] = Array.from(stylistsMap.entries()).map(([name, avatar], idx: number) => ({
                    id: `st${idx}`,
                    name: name,
                    avatar: avatar || undefined
                }));

                const statusStr = data.trangThai === 0 ? 'Đã hủy' : data.trangThai === 1 ? 'Chờ xử lý' : data.trangThai === 2 ? 'Đã trả 100%' : 'Hoàn thành';

                const voucherDisc = data.voucherGiam?.amount || 0;
                const totalDisc = data.flashSaleDiscount + voucherDisc;

                let installments: Installment[] = [];
                let due = 0;
                if (data.trangThai === 1) {
                    const deposit = data.finalAmount * 0.1;
                    due = data.finalAmount - deposit;
                    installments = [
                        { label: 'Cọc 10%', amount: deposit, paid: true },
                        { label: 'Còn lại', amount: due, paid: false },
                    ];
                } else if (data.trangThai === 2 || data.trangThai > 2) {
                    installments = [
                        { label: 'Thanh toán 100%', amount: data.finalAmount, paid: true }
                    ];
                    due = 0;
                } else {
                    installments = [
                        { label: 'Đã hủy', amount: data.finalAmount, paid: false }
                    ];
                    due = 0;
                }

                setInvoice({
                    orderCode: data.maLd,
                    status: statusStr,
                    serviceCount: data.items.length,
                    totalServiceAmount: data.finalAmount,
                    orderDate: `${data.ngayHen ? data.ngayHen.split('T')[0] : ''} ${data.gioHen}`,
                    services,
                    stylists,
                    servicesSubtotal: data.totalOriginal,
                    totalDiscount: totalDisc,
                    grandTotal: data.finalAmount,
                    dueAtStore: due,
                    installments
                });
            } catch (err) {
                console.error("Lỗi lấy chi tiết hóa đơn", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.black} />
            </View>
        );
    }

    if (!invoice) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.sectionTitle}>Không tìm thấy hóa đơn</Text>
                <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: COLORS.paidGreen, fontSize: 16 }}>Quay lại</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <Pressable onPress={() => router.back()} style={styles.headerBackBtn} hitSlop={12}>
                    <Feather name="arrow-left" size={scale(22)} color={COLORS.black} />
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    Chi tiết hóa đơn #{invoice.orderCode}
                </Text>
                <View style={{ width: scale(22) }} />
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={[styles.content, { paddingBottom: scale(32) + insets.bottom }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.centeredContent}>
                    <Animated.View entering={FadeInDown} style={styles.card}>
                        {/* Order code + status */}
                        <View style={styles.orderCodeRow}>
                            <Text style={styles.orderCode}>Mã đơn hàng: {invoice.orderCode}</Text>
                            <View style={[styles.statusBadge, { borderColor: getStatusColor(invoice.status).borderColor }]}>
                                <Text style={[styles.statusBadgeText, { color: getStatusColor(invoice.status).color }]}>{invoice.status}</Text>
                            </View>
                        </View>

                        <View style={styles.dividerThin} />

                        {/* Service lines */}
                        <View style={{ gap: scale(2) }}>
                            {invoice.services.map(s => (
                                <ServiceLineRow key={s.id} item={s} />
                            ))}
                        </View>

                        <View style={styles.dividerBold} />

                        {/* Summary */}
                        <View style={{ gap: scale(10) }}>
                            <InfoLine label="Tổng dịch vụ :" value={`x${invoice.serviceCount}`} />
                            <InfoLine label="Tổng số tiền dịch vụ:" value={formatPrice(invoice.totalServiceAmount)} />
                            <InfoLine label="Ngày đặt:" value={invoice.orderDate} />
                        </View>

                        <View style={styles.dividerThin} />

                        {/* Stylists */}
                        <Text style={styles.stylistLabel}>Stylist (thợ thực hiện):</Text>
                        <View style={styles.stylistRow}>
                            {invoice.stylists.map(st => (
                                <StylistAvatar key={st.id} st={st} />
                            ))}
                        </View>

                        <View style={styles.dividerThin} />

                        {/* Payment breakdown */}
                        <Text style={styles.sectionTitle}>CHI TIẾT THANH TOÁN</Text>

                        <View style={styles.breakdownBox}>
                            <BreakdownLine label="Tạm tính dịch vụ" value={formatPrice(invoice.servicesSubtotal)} />
                            <BreakdownLine label="Tổng tiền giảm" value={formatPrice(invoice.totalDiscount)} />

                            <View style={styles.totalBar}>
                                <Text style={styles.totalBarLabel}>TỔNG :</Text>
                                <Text style={styles.totalBarValue}>{formatPrice(invoice.grandTotal)}</Text>
                            </View>

                            <BreakdownLine label="Thanh toán thêm tại tiệm" value={formatPrice(invoice.dueAtStore)} small />
                        </View>

                        {/* Installments */}
                        <View style={{ gap: scale(12), marginTop: scale(16) }}>
                            {invoice.installments.map((inst, idx) => (
                                <View key={idx} style={styles.installmentRow}>
                                    <Text style={styles.installmentLabel}>{inst.label}</Text>
                                    <Text style={styles.installmentValue}>
                                        {formatPrice(inst.amount)} - {inst.paid ? (
                                            <Text style={styles.installmentPaid}>Đã thanh toán</Text>
                                        ) : (
                                            <Text style={styles.installmentUnpaid}>Chưa thanh toán</Text>
                                        )}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </Animated.View>
                </View>
            </ScrollView>
        </>
    );
}

// =====================================================================
// Styles
// =====================================================================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { paddingTop: scale(16) },
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
        flex: 1,
        fontFamily: FONT.labelRegular,
        fontSize: scale(15),
        color: COLORS.black,
        textAlign: 'center',
    },

    // Card
    card: { backgroundColor: COLORS.white, borderRadius: 12, padding: scale(16) },

    orderCodeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    orderCode: { flex: 1, fontFamily: FONT.labelRegular, fontSize: scale(13), color: COLORS.black, marginRight: scale(8) },
    statusBadge: {
        height: scale(23),
        minWidth: scale(72),
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.statusBorder,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: scale(8),
    },
    statusBadgeText: { fontFamily: FONT.labelRegular, fontSize: scale(11), color: COLORS.statusText },

    dividerThin: { height: 1, backgroundColor: COLORS.divider, marginVertical: scale(14) },
    dividerBold: { height: 1.5, backgroundColor: '#D9D9D9', marginVertical: scale(14) },

    // Service line
    serviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: scale(6), gap: scale(10) },
    serviceThumbWrap: { width: scale(30), height: scale(30), borderRadius: 2, overflow: 'hidden' },
    serviceThumb: { width: '100%', height: '100%' },
    serviceName: { flex: 1, fontFamily: FONT.body, fontSize: scale(11), color: COLORS.black },
    servicePrice: { fontFamily: FONT.body, fontSize: scale(11), color: COLORS.black },

    // Info lines
    infoLineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    infoLineLabel: { fontFamily: FONT.body, fontSize: scale(12), color: COLORS.black },
    infoLineValue: { fontFamily: FONT.body, fontSize: scale(12), color: COLORS.black },

    // Stylists
    stylistLabel: { fontFamily: FONT.labelRegular, fontSize: scale(14), color: COLORS.black, marginBottom: scale(12) },
    stylistRow: { flexDirection: 'row', gap: scale(20) },
    stylistCol: { alignItems: 'center', width: scale(50) },
    stylistAvatarWrap: { width: scale(50), height: scale(50), borderRadius: scale(25), overflow: 'hidden' },
    stylistAvatar: { width: '100%', height: '100%' },
    stylistName: { fontFamily: FONT.gideon, fontSize: scale(11), color: COLORS.black, marginTop: scale(8) },

    sectionTitle: { fontFamily: FONT.labelRegular, fontSize: scale(14), color: COLORS.black, marginBottom: scale(12) },

    // Breakdown box
    breakdownBox: {
        borderWidth: 1,
        borderColor: COLORS.boxBorder,
        borderRadius: 6,
        padding: scale(16),
        gap: scale(14),
    },
    breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    breakdownLabel: { fontFamily: FONT.inclusive, fontSize: scale(14), color: COLORS.black },
    breakdownLabelSmall: { fontSize: scale(12) },
    breakdownValue: { fontFamily: FONT.inclusive, fontSize: scale(14), color: COLORS.black },

    totalBar: {
        backgroundColor: COLORS.black,
        borderRadius: 4,
        height: scale(44),
        paddingHorizontal: scale(12),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    totalBarLabel: { fontFamily: FONT.inclusive, fontSize: scale(14), color: COLORS.white },
    totalBarValue: { fontFamily: FONT.inclusive, fontSize: scale(15), color: COLORS.white },

    // Installments
    installmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    installmentLabel: { fontFamily: FONT.labelRegular, fontSize: scale(14), color: COLORS.black },
    installmentValue: { fontFamily: FONT.labelRegular, fontSize: scale(14), color: COLORS.black },
    installmentPaid: { color: COLORS.paidGreen },
    installmentUnpaid: { color: '#D20E18' },
});