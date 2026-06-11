'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Video,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { get, post } from '@/lib/api';
import type { CalendarEvent, Lead } from '@/types';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isBooking, setIsBooking] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    lead_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    duration: '30',
    title: '',
    description: '',
  });

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      const res = await get<{ results: CalendarEvent[] }>(
        '/calendar/events/',
        { start_date: start, end_date: end }
      );
      setEvents(res.data.results || []);
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await get<{ results: Lead[] }>('/leads/', { page_size: 100 });
      setLeads(res.data.results || []);
    } catch {
      setLeads([]);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleBookMeeting = async () => {
    if (!bookingForm.lead_id || !bookingForm.title) return;
    setIsBooking(true);
    try {
      const startTime = `${bookingForm.date}T${bookingForm.time}:00`;
      const endDate = new Date(
        `${bookingForm.date}T${bookingForm.time}:00`
      );
      endDate.setMinutes(endDate.getMinutes() + parseInt(bookingForm.duration));
      const endTime = format(endDate, "yyyy-MM-dd'T'HH:mm:ss");

      await post('/calendar/events/', {
        lead: parseInt(bookingForm.lead_id),
        title: bookingForm.title,
        description: bookingForm.description,
        start_time: startTime,
        end_time: endTime,
      });
      setShowBookingModal(false);
      setBookingForm({
        lead_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        duration: '30',
        title: '',
        description: '',
      });
      fetchEvents();
    } catch {
      // error handled silently
    } finally {
      setIsBooking(false);
    }
  };

  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventDate = parseISO(event.start_time);
      return isSameDay(eventDate, day);
    });
  };

  const upcomingEvents = events
    .filter((event) => {
      const eventDate = parseISO(event.start_time);
      const now = new Date();
      const weekFromNow = addDays(now, 7);
      return eventDate >= now && eventDate <= weekFromNow;
    })
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const eventColors: Record<string, string> = {
    meeting: 'bg-blue-500',
    call: 'bg-green-500',
    follow_up: 'bg-yellow-500',
    default: 'bg-purple-500',
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
              <button
                onClick={() => setView('month')}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  view === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  view === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
            </div>
          </div>
          <Button onClick={() => setShowBookingModal(true)}>
            <Plus className="h-4 w-4" />
            Book Meeting
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {format(currentDate, 'MMMM yyyy')}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Today
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  <div className="grid grid-cols-7 border-t border-gray-200">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                      (day) => (
                        <div
                          key={day}
                          className="border-b border-r border-gray-200 bg-gray-50 px-2 py-2 text-center text-xs font-medium uppercase text-gray-500 last:border-r-0"
                        >
                          {day}
                        </div>
                      )
                    )}
                    {getDaysInMonth().map((day, idx) => {
                      const dayEvents = getEventsForDay(day);
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);

                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedDate(day)}
                          className={`relative min-h-[80px] cursor-pointer border-b border-r border-gray-200 p-1 transition-colors last:border-r-0 sm:min-h-[100px] sm:p-2 ${
                            isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                          } ${isSelected ? 'ring-2 ring-inset ring-blue-500' : ''} hover:bg-blue-50/50`}
                        >
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                              isToday(day)
                                ? 'bg-blue-600 text-white'
                                : isCurrentMonth
                                  ? 'text-gray-900'
                                  : 'text-gray-400'
                            }`}
                          >
                            {format(day, 'd')}
                          </span>
                          <div className="mt-1 hidden space-y-0.5 sm:block">
                            {dayEvents.slice(0, 3).map((event) => (
                              <div
                                key={event.id}
                                className="flex items-center gap-1 rounded px-1 py-0.5 text-xs"
                              >
                                <div
                                  className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${eventColors[event.status] || eventColors.default}`}
                                />
                                <span className="truncate text-gray-700">
                                  {event.title}
                                </span>
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{dayEvents.length - 3} more
                              </span>
                            )}
                          </div>
                          {dayEvents.length > 0 && (
                            <div className="absolute bottom-1 right-1 sm:hidden">
                              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[10px] font-medium text-blue-700">
                                {dayEvents.length}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {upcomingEvents.length === 0 ? (
                  <EmptyState
                    icon={CalendarIcon}
                    title="No upcoming events"
                    description="Book a meeting to get started"
                  />
                ) : (
                  <div className="divide-y divide-gray-100">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${eventColors[event.status] || eventColors.default}`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {event.title}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>
                                {format(parseISO(event.start_time), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            {event.lead && (
                              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                <User className="h-3 w-3" />
                                <span>{event.lead.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {format(selectedDate, 'MMM d, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {selectedDayEvents.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-gray-500">No events on this day</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {selectedDayEvents.map((event) => (
                        <div key={event.id} className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">
                            {event.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(parseISO(event.start_time), 'h:mm a')} -{' '}
                              {format(parseISO(event.end_time), 'h:mm a')}
                            </span>
                          </div>
                          {event.lead && (
                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                              <User className="h-3 w-3" />
                              <span>{event.lead.name}</span>
                            </div>
                          )}
                          <div className="mt-2">
                            <Badge variant={event.status === 'confirmed' ? 'success' : 'warning'}>
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Book Meeting"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Lead"
            value={bookingForm.lead_id}
            onChange={(e) =>
              setBookingForm({ ...bookingForm, lead_id: e.target.value })
            }
            options={leads.map((lead) => ({
              value: lead.id,
              label: `${lead.name} (${lead.email})`,
            }))}
            placeholder="Select a lead"
          />
          <Input
            label="Title"
            value={bookingForm.title}
            onChange={(e) =>
              setBookingForm({ ...bookingForm, title: e.target.value })
            }
            placeholder="Meeting title"
          />
          <Input
            label="Description"
            value={bookingForm.description}
            onChange={(e) =>
              setBookingForm({ ...bookingForm, description: e.target.value })
            }
            placeholder="Meeting description (optional)"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={bookingForm.date}
              onChange={(e) =>
                setBookingForm({ ...bookingForm, date: e.target.value })
              }
            />
            <Input
              label="Time"
              type="time"
              value={bookingForm.time}
              onChange={(e) =>
                setBookingForm({ ...bookingForm, time: e.target.value })
              }
            />
          </div>
          <Select
            label="Duration"
            value={bookingForm.duration}
            onChange={(e) =>
              setBookingForm({ ...bookingForm, duration: e.target.value })
            }
            options={[
              { value: '15', label: '15 minutes' },
              { value: '30', label: '30 minutes' },
              { value: '45', label: '45 minutes' },
              { value: '60', label: '1 hour' },
              { value: '90', label: '1.5 hours' },
              { value: '120', label: '2 hours' },
            ]}
          />
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowBookingModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookMeeting}
              isLoading={isBooking}
              disabled={!bookingForm.lead_id || !bookingForm.title}
            >
              <Video className="h-4 w-4" />
              Book Meeting
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
