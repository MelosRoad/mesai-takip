"use client"

import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/tr'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { CustomToolbar } from './custom-toolbar'

moment.locale('tr')
const localizer = momentLocalizer(moment)

interface OvertimeCalendarProps {
    events: {
        title: string
        start: Date
        end: Date
        allDay?: boolean
        resource?: any
    }[]
}

export function OvertimeCalendar({ events }: OvertimeCalendarProps) {

    const stringToColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    }

    return (
        <div style={{ height: 500 }}>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month']}
                components={{
                    toolbar: CustomToolbar
                }}
                messages={{
                    next: "İleri",
                    previous: "Geri",
                    today: "Bugün",
                    month: "Ay",
                    week: "Hafta",
                    day: "Gün"
                }}
                eventPropGetter={(event) => {
                    const userName = event.resource?.userName || ""
                    return {
                        style: {
                            backgroundColor: stringToColor(userName),
                            color: 'white',
                            fontSize: '0.8rem'
                        }
                    }
                }}
            />
        </div>
    )
}
