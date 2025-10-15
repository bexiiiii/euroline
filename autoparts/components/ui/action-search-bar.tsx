"use client";

import { useState, useEffect, useRef } from "react";
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
    const { search, isLoading, query: storeQuery, setQuery, clearResults } = useSearchStore();
    
    const [query, setLocalQuery] = useState(searchParams?.get('q') || storeQuery || "");
    const [result, setResult] = useState<SearchResult | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [selectedItem, setSelectedItem] = useState<SearchHistoryItem | null>(null);
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
    
    // Ref for debounced search
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced query for search history
    const debouncedQuery = useDebounce(query, 500);

    // Effect for handling search history
    useEffect(() => {
        if (!isFocused) {
            setResult(null);
            return;
        }

        if (!debouncedQuery) {
            setResult({ history: searchHistory.slice(0, 4) });
            return;
        }

        const normalizedQuery = debouncedQuery.toLowerCase().trim();
        const filteredHistory = searchHistory.filter((item) => {
            const searchableText = item.query.toLowerCase();
            return searchableText.includes(normalizedQuery);
        });

        setResult({ history: filteredHistory.slice(0, 4) });
    }, [debouncedQuery, isFocused, searchHistory]);

    // Синхронизация с URL параметрами только при монтировании
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

    // Professional debounced search - triggers only after user stops typing
    useEffect(() => {
        // Clear any existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        const trimmed = query.trim();
        
        // Don't search if empty
        if (trimmed.length === 0) {
            return;
        }

        // Don't search if too short (minimum 2 characters)
        if (trimmed.length < 2) {
            return;
        }

        // Set timeout for debounced search (600ms is professional standard)
        searchTimeoutRef.current = setTimeout(() => {
            void performSearch(trimmed);
        }, 600);

        // Cleanup on unmount or when query changes
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [query]); // Only depend on query

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalQuery(value);
        setQuery(value);
        
        // Only show search history dropdown when there are at least 3 characters
        if (value.length >= 3 || value.length === 0) {
            setIsFocused(true);
        } else {
            setIsFocused(false);
        }
    };

    const performSearch = async (searchQuery: string) => {
        const normalized = searchQuery.trim();
        if (!normalized) {
            return;
        }

        // Минимальная длина для поиска - 3 символа
        if (normalized.length < 3) {
            return;
        }

        // Добавляем в историю
        addToHistory(normalized);
        
        // Выполняем поиск
        const searchResult = await search(normalized);
        
        // Если найден автомобиль по VIN, открываем в новой вкладке каталог
        if (searchResult?.detectedType === 'VIN' && searchResult?.vehicle) {
            const vehicleId = searchResult.vehicle.vehicleId;
            const ssd = searchResult.vehicle.ssd;
            if (vehicleId && ssd) {
                const catalogUrl = `/catalogs/${vehicleId}?vin=${encodeURIComponent(normalized)}&ssd=${encodeURIComponent(ssd)}&brand=${encodeURIComponent(searchResult.vehicle.brand || '')}&name=${encodeURIComponent(searchResult.vehicle.name || '')}`;
                window.open(catalogUrl, '_blank');
                setIsFocused(false);
                setSelectedItem(null);
                return;
            }
        }
        
        // Для остальных типов поиска перенаправляем на страницу результатов
        setIsFocused(false);
        setSelectedItem(null);
        router.push(`/search?q=${encodeURIComponent(normalized)}`);
    };

    const clearSearch = () => {
        setLocalQuery('');
        setQuery('');
        clearResults();
        
        // Cancel pending search
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }
        
        setIsFocused(false);
    };

    const handleHistoryItemClick = (item: SearchHistoryItem) => {
        setLocalQuery(item.query);
        setQuery(item.query);
        setSelectedItem(item);
        
        // Cancel pending debounced search and perform immediate search
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }
        
        // Perform immediate search for history items
        performSearch(item.query);
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
        const normalized = query.trim();
        if (!normalized) return;
        setSearchHistory(prev => {
            const existingIndex = prev.findIndex(item => item.query === normalized);
            let updated = [...prev];

            if (existingIndex !== -1) {
                updated.splice(existingIndex, 1);
            }

            updated.unshift({
                id: uuidv4(),
                query: normalized,
                timestamp: new Date(),
            });

            return updated.slice(0, 4);
        });
    };

    const handleFocus = () => {
        setSelectedItem(null);
        setIsFocused(true);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && query.trim()) {
            // Cancel debounced search and perform immediate search on Enter
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
                searchTimeoutRef.current = null;
            }
            
            void performSearch(query);
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
                            onBlur={() => setTimeout(() => {
                                // Only hide dropdown if not clicking on history items
                                if (!selectedItem) {
                                    setIsFocused(false);
                                }
                            }, 200)}
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
                                            onClick={clearSearch}
                                        >
                                            <X className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
                                        </motion.div>
                                        <motion.div
                                            key="send"
                                            initial={{ y: -20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: 20, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            onClick={() => {
                                                // Cancel debounced search and perform immediate search on button click
                                                if (searchTimeoutRef.current) {
                                                    clearTimeout(searchTimeoutRef.current);
                                                    searchTimeoutRef.current = null;
                                                }
                                                void performSearch(query);
                                            }}
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
                                {result.history.slice(0, 4).map((item) => (
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

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
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

export { ActionSearchBar };
