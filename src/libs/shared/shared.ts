export type IDParams = {
    id: string;
};

export type SearchResult<T> = {
    totalData: number;
    data: T[];
};

export type PaginationParams<T extends string = string> = {
    page?: number;
    limit?: number;
    select?: T[];
    sort?: string;
    order?: 'ASC' | 'DESC';
};
