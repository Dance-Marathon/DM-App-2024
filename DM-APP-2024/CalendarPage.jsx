import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Calendar, CalendarUtils } from 'react-native-calendars';
import { View, Text, StyleSheet, TextStyle, Button, TextInput, TouchableOpacity } from 'react-native';
import {addCalanderEntry, readCalanderEntries} from './Firebase/CalanderManager'
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
    const eventsText = eventsForToday.map(event => `${event.key}`).join('\n');


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
      ['2024-04-13']: {
        periods: [
          { key: 'Main Event!', startingDay: true, endingDay: false, color: 'orange' },
        ]
      },
      ['2024-04-14']: {
        periods: [
          { key: 'Main Event!', startingDay: false, endingDay: true, color: 'orange' },
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

  const [{key, theme}, setTheme] = useState({key: 'dark', theme: 'light'})

  // displays calendar and list of events for each day
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Main Event on April 13th!</Text>
      <View style={styles.calendarContainer} key={key}>
        <Calendar
          enableSwipeMonths
          markingType={'multi-period'}
          style={styles.calendar}
          markedDates={marked}
          onDayPress={onDayPress}
          theme={{
            backgroundColor: '#4F6797',
            calendarBackground: '#4F6797',
            textSectionTitleColor: 'white', // Color of the month and year in the title
            dayTextColor: 'white',
            monthTextColor: 'white', // Specifically for month text color
            indicatorColor: 'white',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 16,
            arrowColor: 'white',
          }}
        />
      </View>
      {/*<TouchableOpacity style={styles.addButton} onPress={async () => {
        await addCalanderEntry();
        let entries = await readCalanderEntries();
        console.log(entries);
      }}>
        <Text style={styles.addButtonText}>Add Entry</Text>
      </TouchableOpacity>*/}
      <View style={styles.eventDetail}>
        <Text style={styles.subtitle}>Click a Date to See Events</Text>
        <Text style={styles.headerText}>{selectedDay}</Text>
        <Text style={styles.eventsText}>{eventsForDay}</Text>
      </View>
    </View>
  );
};

export default CalendarComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#233563',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingBottom: 2,
    color: 'white',
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: 20,
    color: 'white',
  },
  eventsText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 10,
    marginLeft: 20,
  },
  calendar: {
    marginBottom: 10,
    backgroundColor: '#4F6797',
    monthTextColor: 'white',
    dayTextColor: 'white',
    borderRadius: 10,
    width: '95%',
    marginLeft: 'auto',
    marginRight: 'auto',
    calendarBackground: 'red',
  },
  calendarContainer: {
    width: '100%',
    alignSelf: 'center',
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
    paddingVertical: 20,
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  addButton: {
    marginHorizontal: 10,
    backgroundColor: '#00adf5',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventDetail: {
    backgroundColor: '#233D72', // Slightly lighter dark color for the event detail box
    padding: 20,
    borderRadius: 20,
    margin: 10,
    marginTop: 20,
    height: 175,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
