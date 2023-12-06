import React, { useState } from 'react';
import { Calendar as RNCalendar, LocaleConfig } from 'react-native-calendars';
import { View, Text } from 'react-native';

const CalendarComponent = () => {
  const [selected, setSelected] = useState('');

  return (
    <View>
      <RNCalendar
        onDayPress={(day) => {
          setSelected(day.dateString);
        }}
        markedDates={{
          [selected]: { selected: true, disableTouchEvent: true, selectedDotColor: 'orange' },
        }}
      />
    </View>
  );
};

export default CalendarComponent;