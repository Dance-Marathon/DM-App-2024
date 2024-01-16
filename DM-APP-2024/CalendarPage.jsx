import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Calendar, CalendarUtils } from 'react-native-calendars';
import { View, Text, StyleSheet, TextStyle, Button, TextInput } from 'react-native';

const INITIAL_DATE = new Date();

const CalendarComponent = () => {
  // used to track events per day
  const [selected, setSelected] = useState(INITIAL_DATE);
  const [selectedDay, setSelectedDay] = useState('');
  const [eventsForDay, setEventsForDay] = useState('');

  // what happens each time a day is pressed
  const onDayPress = useCallback((day) => {
    setSelected(day.dateString);
    const eventsForToday = getMarkedKeysForDay(day.dateString);

    const headerText = `${day.dateString}:`;
    const eventsText = eventsForToday.map(event => `${event.key} (${event.color})`).join('\n');


    //const eventsForDayText = `${headerText}\n${eventsText}`;
    setSelectedDay(headerText)
    setEventsForDay(eventsText);
  }, []);

  // list of all events for each day
  const marked = useMemo(() => {
    return {
      ['2024-01-10']: {
        periods: [
          { key: 'Chipotle Hospitality Night', startingDay: true, endingDay: true, color: 'blue' },
          { key: 'Test', startingDay: true, endingDay: true, color: 'black' },
        ]
      },
      ['2024-01-16']: {
        periods: [
          { key: 'Faculty Staff Appreciation Week', startingDay: true, endingDay: false, color: 'orange' },
        ]
      },
      ['2024-01-17']: {
        periods: [
          { key: 'Faculty Staff Appreciation Week', startingDay: false, endingDay: false, color: 'orange' },
        ]
      },
      ['2024-01-18']: {
        periods: [
          { key: 'Faculty Staff Appreciation Week', startingDay: false, endingDay: false, color: 'orange' },
        ]
      },
      ['2024-01-19']: {
        periods: [
          { key: 'Faculty Staff Appreciation Week', startingDay: false, endingDay: true, color: 'orange' },
        ]
      },
      ['2024-01-22']: {
        periods: [
          { key: 'Dancer Week', startingDay: true, endingDay: false, color: 'green' },
        ]
      },
      ['2024-01-23']: {
        periods: [
          { key: 'Dancer Week', startingDay: false, endingDay: false, color: 'green' },
        ]
      },
      ['2024-01-24']: {
        periods: [
          { key: 'Dancer Week', startingDay: false, endingDay: false, color: 'green' },
        ]
      },
      ['2024-01-25']: {
        periods: [
          { key: 'Dancer Week', startingDay: false, endingDay: false, color: 'green' },
        ]
      },
      ['2024-01-26']: {
        periods: [
          { key: 'Dancer Week', startingDay: false, endingDay: true, color: 'green' },
        ]
      },
      ['2024-02-15']: {
        periods: [
          { key: 'Stand Up and Holler', startingDay: true, endingDay: true, color: 'pink' },
        ]
      },
      ['2024-02-18']: {
        periods: [
          { key: 'Miracles in Color 5k', startingDay: true, endingDay: true, color: 'purple' },
        ]
      },
    };
  }, [selected]);

  // returns the list of events for a specific day and the color they are associated with
  const getMarkedKeysForDay = (day) => {
    const markedDay = marked[day];

    if (markedDay) {
      return markedDay.periods.map(period => ({ key: period.key, color: period.color }));
    }
    else {
      return [];
    }
  }

  // displays calendar and list of events for each day
  return (
    <View>
      <Text style={styles.text}>Main Event on April 13th!</Text>
      <Calendar
        enableSwipeMonths
        markingType={'multi-period'}
        style={styles.calendar}
        markedDates={marked}
        onDayPress={onDayPress}
      />
      <Text style={styles.headerText}>{selectedDay}</Text>
      <Text style={styles.eventsText}>{eventsForDay}</Text>
    </View>
  );
};

export default CalendarComponent;

const styles = StyleSheet.create({
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingBottom: 2,
  },
  eventsText: {
    fontSize: 16,
  },
  calendar: {
    marginBottom: 10
  },
  switchContainer: {
    flexDirection: 'row',
    margin: 10,
    alignItems: 'center'
  },
  switchText: {
    margin: 10,
    fontSize: 16
  },
  text: {
    textAlign: 'center',
    padding: 10,
    backgroundColor: 'lightgrey',
    fontSize: 16
  },
  disabledText: {
    color: 'grey'
  },
  defaultText: {
    color: 'purple'
  },
  customCalendar: {
    height: 250,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgrey'
  },
  customDay: {
    textAlign: 'center'
  },
  customHeader: {
    backgroundColor: '#FCC',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: -4,
    padding: 8
  },
  customTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10
  },
  customTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00BBF2'
  }

});
