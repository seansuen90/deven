///workspaces/deven/app/api/events/route.ts

import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import Event from "@/database/event.model"
import { v2 as cloudinary } from 'cloudinary'

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const formData = await req.formData();

        let event;

        try {
            event = Object.fromEntries(formData.entries());
        } catch (e) {
            return NextResponse.json({ message: 'Invalid JSON data format' }, { status: 400 });
        }

        /**
         * Retrieve the 'image' field directly from FormData.
         * FormData is used because uploaded files cannot be represented in a normal JSON object.
         */
        const file = formData.get('image') as File;
        if (!file) return NextResponse.json({ message: 'Image file is required' }, { status: 400 });

        let tags = JSON.parse(formData.get('tags') as string);
        let agenda = JSON.parse(formData.get('agenda') as string);

        /**
         * Convert the uploaded File to an ArrayBuffer.
         * This reads the file's binary contents in memory.
         */
        const arrayBuffer = await file.arrayBuffer();

        /**
         * Convert the ArrayBuffer to a Node.js Buffer.
         * cloudinary.uploader.upload_stream expects a Buffer as input.
         */
        const buffer = Buffer.from(arrayBuffer);

        /**
         * Upload the image to Cloudinary using an upload stream.
         * The Promise wraps the callback-based upload_stream function so it can be used with await.
         * resolve(results) provides the upload result on success.
         * reject(error) handles upload errors.
         * .end(buffer) signals the stream to start reading the provided buffer.
         */
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { resource_type: 'image', folder: 'DevEvent' },
                (error, results) => {
                    if (error) return reject(error);
                    resolve(results);
                }
            ).end(buffer);
        });

        /**
         * Assign the secure URL returned by Cloudinary to the event's image field.
         */
        event.image = (uploadResult as { secure_url: string }).secure_url

        const createdEvent = await Event.create({
            ...event,
            tags: tags,
            agenda: agenda,
        });

        return NextResponse.json({ message: 'Event Created Successfully', event: createdEvent }, { status: 201 });

    } catch (e) {
        console.error(e);
        return NextResponse.json({
            message: 'Event Creation Failed',
            error: e instanceof Error ? e.message : 'Unknown'
        }, { status: 500 })
    }
}

export async function GET() {
    try {
        await connectDB();

        const events = await Event.find().sort({ createdAt: -1 });

        return NextResponse.json({ message: 'Event fetched successfully', events }, { status: 200 });

    } catch (e) {
        return NextResponse.json({ message: 'Event Fetching Failed', error: e }, { status: 500 });
    }
}
