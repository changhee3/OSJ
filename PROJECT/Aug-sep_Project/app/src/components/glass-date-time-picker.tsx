import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors, AppSpacing, AppTypography } from '@/constants/app-theme';
import { GlassSurface } from './glass-surface';

type SelectedDate = { year: number; month: number; day: number };

type GlassDateTimePickerProps = {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function getMonthCells(year: number, month: number) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// 애플 기본 캘린더/시계 대신, 앱 디자인(유리 패널 + 파란 포인트)에 맞춘
// 자체 제작 날짜·시간 선택 패널.
export function GlassDateTimePicker({
  visible,
  value,
  onConfirm,
  onClose,
}: GlassDateTimePickerProps) {
  const [cursorYear, setCursorYear] = useState(value.getFullYear());
  const [cursorMonth, setCursorMonth] = useState(value.getMonth());
  const [selected, setSelected] = useState<SelectedDate>({
    year: value.getFullYear(),
    month: value.getMonth(),
    day: value.getDate(),
  });
  const [hour, setHour] = useState(value.getHours());
  const [minute, setMinute] = useState(value.getMinutes() - (value.getMinutes() % 30));

  useEffect(() => {
    if (!visible) return;
    setCursorYear(value.getFullYear());
    setCursorMonth(value.getMonth());
    setSelected({
      year: value.getFullYear(),
      month: value.getMonth(),
      day: value.getDate(),
    });
    setHour(value.getHours());
    setMinute(value.getMinutes() - (value.getMinutes() % 30));
  }, [visible, value]);

  const changeMonth = (delta: number) => {
    let month = cursorMonth + delta;
    let year = cursorYear;
    if (month < 0) {
      month = 11;
      year -= 1;
    } else if (month > 11) {
      month = 0;
      year += 1;
    }
    setCursorMonth(month);
    setCursorYear(year);
  };

  const adjustMinutes = (delta: number) => {
    const total = (((hour * 60 + minute + delta) % 1440) + 1440) % 1440;
    setHour(Math.floor(total / 60));
    setMinute(total % 60);
  };

  const toggleAmPm = () => {
    setHour((current) => (current + 12) % 24);
  };

  const isAm = hour < 12;
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  const handleConfirm = () => {
    onConfirm(new Date(selected.year, selected.month, selected.day, hour, minute));
  };

  const cells = getMonthCells(cursorYear, cursorMonth);

  // RN의 <Modal>은 안드로이드에서 react-native-screens(화면 전환 관리)와
  // 충돌해 "Unexpected fragment manager state" 크래시를 일으킬 수 있어서,
  // 별도 네이티브 창을 띄우는 Modal 대신 화면 안에 겹쳐 그리는 오버레이로 구현한다.
  if (!visible) return null;

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View pointerEvents="box-none" style={styles.sheetWrap}>
        <GlassSurface
          intensity={80}
          overlayColor="rgba(255,255,255,0.82)"
          contentStyle={styles.sheet}>
          <View style={styles.monthHeader}>
            <Pressable style={styles.navButton} onPress={() => changeMonth(-1)}>
              <Text style={styles.navArrow}>‹</Text>
            </Pressable>
            <Text style={styles.monthLabel}>
              {cursorYear}년 {cursorMonth + 1}월
            </Text>
            <Pressable style={styles.navButton} onPress={() => changeMonth(1)}>
              <Text style={styles.navArrow}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((weekday) => (
              <Text key={weekday} style={styles.weekdayText}>
                {weekday}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, index) => {
              const isSelected =
                day !== null &&
                selected.year === cursorYear &&
                selected.month === cursorMonth &&
                selected.day === day;
              return (
                <Pressable
                  key={index}
                  style={styles.cell}
                  disabled={day === null}
                  onPress={() =>
                    day !== null &&
                    setSelected({ year: cursorYear, month: cursorMonth, day })
                  }>
                  {day !== null ? (
                    <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}>
                      <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                        {day}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>시간</Text>
            <View style={styles.timeStepper}>
              <Pressable style={styles.stepperButton} onPress={() => adjustMinutes(-30)}>
                <Text style={styles.stepperText}>−</Text>
              </Pressable>
              <Pressable style={styles.ampmButton} onPress={toggleAmPm}>
                <Text style={styles.ampmText}>{isAm ? '오전' : '오후'}</Text>
              </Pressable>
              <Text style={styles.timeValue}>
                {String(hour12).padStart(2, '0')}:{String(minute).padStart(2, '0')}
              </Text>
              <Pressable style={styles.stepperButton} onPress={() => adjustMinutes(30)}>
                <Text style={styles.stepperText}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={[styles.actionButton, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.confirmButton]}
              onPress={handleConfirm}>
              <Text style={styles.confirmText}>확인</Text>
            </Pressable>
          </View>
        </GlassSurface>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,11,13,0.35)',
    zIndex: 100,
    elevation: 100,
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.screenPadding,
  },
  sheet: {
    padding: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: {
    fontSize: 22,
    color: AppColors.primary,
    fontWeight: '700',
  },
  monthLabel: {
    ...AppTypography.cardTitle,
    color: AppColors.ink,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayText: {
    ...AppTypography.caption,
    color: AppColors.muted,
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: AppColors.primary,
  },
  dayText: {
    ...AppTypography.body,
    fontSize: 15,
    color: AppColors.ink,
  },
  dayTextSelected: {
    color: AppColors.canvas,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.glassBorder,
  },
  timeLabel: {
    ...AppTypography.body,
    color: AppColors.muted,
  },
  timeStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ampmButton: {
    height: 36,
    paddingHorizontal: 10,
    borderRadius: AppSpacing.radiusPill,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: AppColors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ampmText: {
    ...AppTypography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primary,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: AppColors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 20,
    color: AppColors.primary,
    fontWeight: '700',
  },
  timeValue: {
    ...AppTypography.cardTitle,
    color: AppColors.ink,
    minWidth: 64,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: AppSpacing.radiusPill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: AppColors.glassBorder,
  },
  cancelText: {
    ...AppTypography.button,
    color: AppColors.body,
  },
  confirmButton: {
    backgroundColor: AppColors.primary,
  },
  confirmText: {
    ...AppTypography.button,
    color: AppColors.canvas,
  },
});
