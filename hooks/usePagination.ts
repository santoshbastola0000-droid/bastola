import { useState, useEffect } from "react";

interface BasePaginationParams {
  page: number;
  take: number;
  search?: string;
}

interface UsePaginationProps<T extends BasePaginationParams> {
  initialPage?: number;
  initialTake?: number;
  initialFilters?: Record<string, string>;
  onSearch?: (params: T) => void;
}

export const usePagination = <T extends BasePaginationParams>(
  {
    initialPage = 0,
    initialTake = 10,
    initialFilters = {},
    onSearch,
  }: UsePaginationProps<T> = {} as UsePaginationProps<T>,
) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState<string>("");
  const [pagination, setPagination] = useState({
    page: initialPage,
    take: initialTake,
  });
  const [filters, setFilters] =
    useState<Record<string, string>>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<Record<string, string>>(initialFilters);

  // Handle search when searchTerm becomes empty (backspace/delete)
  useEffect(() => {
    if (searchTerm === "" && appliedSearchTerm !== "") {
      handleSearch();
    }
  }, [searchTerm, appliedSearchTerm]);

  useEffect(() => {
    const hasFilterChanges = Object.keys(filters).some(
      (key) => filters[key] !== appliedFilters[key],
    );

    if (hasFilterChanges) {
      setAppliedFilters(filters);
      setPagination((prev) => ({ ...prev, page: initialPage }));

      if (onSearch) {
        const params = {
          ...pagination,
          page: initialPage,
          search: searchTerm,
          ...filters,
        } as T;
        onSearch(params);
      }
    }
  }, [filters, appliedFilters, initialPage, onSearch, pagination, searchTerm]);

  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm);
    setPagination((prev) => ({ ...prev, page: initialPage }));

    if (onSearch) {
      const params = {
        ...pagination,
        page: initialPage,
        search: searchTerm,
        ...appliedFilters,
      } as T;
      onSearch(params);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));

    if (onSearch) {
      const params = {
        ...pagination,
        page: newPage,
        search: appliedSearchTerm,
        ...appliedFilters,
      } as T;
      onSearch(params);
    }
  };

  const handlePageSizeChange = (newTake: number) => {
    const newPagination = { page: initialPage, take: newTake };
    setPagination(newPagination);

    if (onSearch) {
      const params = {
        ...newPagination,
        search: appliedSearchTerm,
        ...appliedFilters,
      } as T;
      onSearch(params);
    }
  };

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
    setAppliedFilters({});

    if (onSearch) {
      const params = {
        ...pagination,
        page: initialPage,
        search: appliedSearchTerm,
      } as T;
      onSearch(params);
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    appliedSearchTerm,
    pagination,
    filters,
    appliedFilters,
    setFilters,
    updateFilter,
    clearFilters,
    handleSearch,
    handleKeyDown,
    handlePageChange,
    handlePageSizeChange,
  };
};
