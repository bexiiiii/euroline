"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Send,
    Clock,
    X,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useSearchStore } from "@/lib/stores/searchStore";
import { useRouter, useSearchParams } from "next/navigation";

function useDebounce<T>(value: T, delay: number = 1000): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

export interface SearchHistoryItem {
    id: string;
    query: string;
    timestamp: Date;
    resultsCount?: number;
}

interface SearchResult {
    history: SearchHistoryItem[];
}

function ActionSearchBar() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { search, isLoading, query: storeQuery, setQuery } = useSearchStore();
    
    const [query, setLocalQuery] = useState(searchParams?.get('q') || storeQuery || "");
    const [result, setResult] = useState<SearchResult | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedItem, setSelectedItem] = useState<SearchHistoryItem | null>(null);
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

    const debouncedQuery = useDebounce(query, 800); // Увеличили задержку

    // Синхронизация с URL параметрами
    useEffect(() => {
        const urlQuery = searchParams?.get('q') || '';
        setLocalQuery(urlQuery);
        setQuery(urlQuery);
    }, [searchParams, setQuery]);

    // Загрузка из localStorage при монтировании
    useEffect(() => {
        const stored = localStorage.getItem("search-history");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const withDates = parsed.map((item: any) => ({
                    ...item,
                    timestamp: new Date(item.timestamp),
                }));
                setSearchHistory(withDates);
            } catch (err) {
                console.error("Ошибка при парсинге search-history", err);
            }
        }
    }, []);

    // Сохранение в localStorage при изменении истории
    useEffect(() => {
        localStorage.setItem("search-history", JSON.stringify(searchHistory));
    }, [searchHistory]);

    useEffect(() => {
        if (!isFocused) {
            setResult(null);
            return;
        }

        if (!debouncedQuery) {
            setResult({ history: searchHistory });
            return;
        }

        const normalizedQuery = debouncedQuery.toLowerCase().trim();
        const filteredHistory = searchHistory.filter((item) => {
            const searchableText = item.query.toLowerCase();
            return searchableText.includes(normalizedQuery);
        });

        setResult({ history: filteredHistory });
    }, [debouncedQuery, isFocused, searchHistory]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalQuery(value);
        setQuery(value);
        setIsTyping(true);
    };

    const handleSearch = async (queryToSearch?: string) => {
        const finalQuery = queryToSearch || query;
        if (!finalQuery.trim()) {
            return;
        }

        // Минимальная длина для поиска - 3 символа
        if (finalQuery.trim().length < 3) {
            return;
        }

        // Добавляем в историю
        addToHistory(finalQuery);
        
        // Выполняем поиск
        const searchResult = await search(finalQuery);
        
        // Если найден автомобиль по VIN, открываем в новой вкладке каталог
        if (searchResult?.detectedType === 'VIN' && searchResult?.vehicle) {
            const vehicleId = searchResult.vehicle.vehicleId;
            const ssd = searchResult.vehicle.ssd;
            if (vehicleId && ssd) {
                const catalogUrl = `/catalogs/${vehicleId}?vin=${encodeURIComponent(finalQuery)}&ssd=${encodeURIComponent(ssd)}&brand=${encodeURIComponent(searchResult.vehicle.brand || '')}&name=${encodeURIComponent(searchResult.vehicle.name || '')}`;
                window.open(catalogUrl, '_blank');
                setIsFocused(false);
                setSelectedItem(null);
                return;
            }
        }
        
        // Для остальных типов поиска перенаправляем на страницу результатов
        router.push(`/search?q=${encodeURIComponent(finalQuery)}`);
        
        setIsFocused(false);
        setSelectedItem(null);
    };    const handleHistoryItemClick = (item: SearchHistoryItem) => {
        setLocalQuery(item.query);
        setQuery(item.query);
        setSelectedItem(item);
        handleSearch(item.query);
    };

    const removeFromHistory = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSearchHistory(prev => prev.filter(item => item.id !== id));
    };

    const formatTimestamp = (timestamp: Date) => {
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
            return `${diffInMinutes} мин назад`;
        } else if (diffInHours < 24) {
            return `${diffInHours} ч назад`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays} дн назад`;
        }
    };

    const addToHistory = (query: string) => {
        setSearchHistory(prev => {
            const existingIndex = prev.findIndex(item => item.query === query);
            let updated = [...prev];

            if (existingIndex !== -1) {
                updated.splice(existingIndex, 1);
            }

            updated.unshift({
                id: uuidv4(),
                query,
                timestamp: new Date(),
            });

            return updated.slice(0, 20);
        });
    };

    const handleFocus = () => {
        setSelectedItem(null);
        setIsFocused(true);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && query.trim()) {
            handleSearch();
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="relative flex flex-col justify-start items-center">
                <div className="w-full sticky top-0 bg-background z-10 pt-4 pb-1">
                    
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Введите название запчасти, марку автомобиля или артикул..."
                            value={query}
                            onChange={handleInputChange}
                            onFocus={handleFocus}
                            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                            onKeyDown={handleKeyPress}
                            disabled={isLoading}
                            className="pl-5 pr-16 py-4 h-16 text-lg rounded-xl focus-visible:ring-offset-0 border-2 focus-visible:border-orange-500"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-fit">
                            <AnimatePresence mode="popLayout">
                                {isLoading ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ y: -20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 20, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                    </motion.div>
                                ) : query.length > 0 ? (
                                    <div className="flex gap-2">
                                        <motion.div
                                            key="clear"
                                            initial={{ y: -20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: 20, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            onClick={() => {
                                                setLocalQuery('');
                                                setQuery('');
                                                router.push('/search');
                                            }}
                                        >
                                            <X className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
                                        </motion.div>
                                        <motion.div
                                            key="send"
                                            initial={{ y: -20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: 20, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            onClick={() => handleSearch()}
                                        >
                                            <Send className="w-5 h-5 text-blue-500 hover:text-blue-600 cursor-pointer" />
                                        </motion.div>
                                    </div>
                                ) : (
                                    <motion.div
                                        key="search"
                                        initial={{ y: -20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 20, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Search className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* История поиска */}
                {isFocused && result && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-20 left-0 right-0 bg-white rounded-lg border shadow-lg max-h-60 overflow-y-auto z-50"
                    >
                        {result.history.length > 0 ? (
                            <>
                                <div className="p-3 text-sm text-gray-500 border-b">
                                    История поиска
                                </div>
                                {result.history.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer group"
                                        onClick={() => handleHistoryItemClick(item)}
                                    >
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <div className="flex-1">
                                            <div className="text-sm">{item.query}</div>
                                            <div className="text-xs text-gray-500">
                                                {formatTimestamp(item.timestamp)}
                                                {item.resultsCount && ` • ${item.resultsCount} результатов`}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => removeFromHistory(item.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                                        >
                                            <X className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="p-4 text-sm text-gray-500 text-center">
                                История поиска пуста
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export { ActionSearchBar };
