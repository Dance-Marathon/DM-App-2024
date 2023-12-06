import React, { useState } from 'react';
import { Calendar as RNCalendar, LocaleConfig } from 'react-native-calendars';
import { View, Text } from 'react-native';

const CalendarComponent = () => {
  const [selected, setSelected] = useState('');
  const [events, setEvents] = useState({
    '2023-12-10': [{ title: 'Event 1' }],
    '2023-12-15': [{ title: 'Event 2' }, { title: 'Event 3' }],
    '2023-12-20': [{ title: 'Event 4' }],
  });

  const markedDates = {};
  Object.keys(events).forEach((date) => {
    markedDates[date] = { dots: [{ color: 'orange' }] }; // You can customize dot properties here
  });

  return (
    <View style={{ flex: 1 }}>
      <RNCalendar
        onDayPress={(day) => {
          setSelected(day.dateString);
        }}
        markedDates={{
          ...markedDates,
          [selected]: { selected: true, disableTouchEvent: true, selectedDotColor: 'orange' },
        }}
      />
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Events for {selected}:</Text>
        {events[selected] &&
          events[selected].map((event, index) => (
            <Text key={index}>{event.title}</Text>
          ))}
      </View>
    </View>
  );
};

export default CalendarComponent;
