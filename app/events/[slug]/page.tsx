import React from 'react'

const EventDetailsPage = async ({params}: {params: Promise<{slug: string}>}) => {
    const {slug} = await params;
  return (
    <section id='event'>
        <h1>Event Details: {slug}</h1>
    </section>
  )
}

export default EventDetailsPage