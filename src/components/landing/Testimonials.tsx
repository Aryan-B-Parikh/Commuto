'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { testimonials } from '@/data/testimonials';
import { RatingStars } from '@/components/ui/RatingStars';

export const Testimonials: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    const nextTestimonial = () => {
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    return (
        <section className="py-20 lg:py-32 bg-gradient-to-br from-blue-600 to-blue-700 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="text-blue-200 font-semibold text-sm uppercase tracking-wider">Testimonials</span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-4">
                        Loved by Commuters Everywhere
                    </h2>
                    <p className="text-lg text-blue-100 max-w-2xl mx-auto">
                        Don&apos;t just take our word for it. Here&apos;s what our community has to say.
                    </p>
                </motion.div>

                {/* Main Testimonial */}
                <div className="relative max-w-4xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeIndex}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl"
                        >
                            {/* Quote Icon */}
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                </svg>
                            </div>

                            {/* Content */}
                            <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
                                &quot;{testimonials[activeIndex].content}&quot;
                            </p>

                            {/* Author */}
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={testimonials[activeIndex].avatar}
                                        alt={testimonials[activeIndex].name}
                                        className="w-14 h-14 rounded-full bg-gray-100"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900">{testimonials[activeIndex].name}</p>
                                        <p className="text-sm text-gray-500">{testimonials[activeIndex].role}</p>
                                    </div>
                                </div>
                                <RatingStars rating={testimonials[activeIndex].rating} size="md" showValue={false} />
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex justify-center gap-4 mt-8">
                        <button
                            onClick={prevTestimonial}
                            className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={nextTestimonial}
                            className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Indicators */}
                    <div className="flex justify-center gap-2 mt-6">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-white' : 'bg-white/40'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Decorative Avatars */}
                <div className="hidden lg:block">
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute left-20 top-1/2"
                    >
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                            <img
                                src={testimonials[1]?.avatar}
                                alt=""
                                className="w-12 h-12 rounded-full"
                            />
                        </div>
                    </motion.div>
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 5, repeat: Infinity }}
                        className="absolute right-20 top-1/3"
                    >
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                            <img
                                src={testimonials[2]?.avatar}
                                alt=""
                                className="w-12 h-12 rounded-full"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
