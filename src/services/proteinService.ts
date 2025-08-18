export interface ProteinData {
  id: string;
  title: string;
  organism: string;
  method: string;
  resolution: number;
  structure: string;
  sequence: string;
}

export interface ProteinSearchResult {
  id: string;
  title: string;
  organism: string;
  method: string;
  resolution: number;
  releaseDate: string;
}

class ProteinService {
  private readonly BASE_URL = 'https://files.rcsb.org/download';
  private readonly SEARCH_URL = 'https://search.rcsb.org/rcsbsearch/v2/query';

  async fetchProteinStructure(pdbId: string): Promise<string> {
    try {
      const response = await fetch(`${this.BASE_URL}/${pdbId.toUpperCase()}.pdb`);
      if (!response.ok) {
        throw new Error(`Failed to fetch protein structure: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error fetching protein structure:', error);
      throw error;
    }
  }

  async searchProteins(query: string, limit: number = 20): Promise<ProteinSearchResult[]> {
    try {
      const searchQuery = {
        query: {
          type: "group",
          logical_operator: "and",
          nodes: [
            {
              type: "terminal",
              service: "text",
              parameters: {
                operator: "contains_phrase",
                value: query,
                attribute: "rcsb_entity_source_organism.rcsb_gene_name.value"
              }
            }
          ]
        },
        return_type: "entry",
        request_options: {
          paginate: {
            start: 0,
            rows: limit
          },
          results_content_type: [
            "experimental"
          ],
          sort: [
            {
              sort_by: "score",
              direction: "desc"
            }
          ]
        }
      };

      const response = await fetch(this.SEARCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchQuery)
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.result_set.map((item: any) => ({
        id: item.identifier,
        title: item?.rcsb_entry_info?.title || 'Unknown',
        organism: item?.rcsb_entity_source_organism?.[0]?.scientific_name || 'Unknown',
        method: item?.exptl?.[0]?.method || 'Unknown',
        resolution: item?.rcsb_entry_info?.resolution_combined?.[0] || 0,
        releaseDate: item?.rcsb_accession_info?.initial_release_date || ''
      }));
    } catch (error) {
      console.error('Error searching proteins:', error);
      return [];
    }
  }

  async getProteinInfo(pdbId: string): Promise<ProteinData | null> {
    try {
      const response = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${pdbId.toUpperCase()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch protein info: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: pdbId.toUpperCase(),
        title: data?.rcsb_entry_info?.title || 'Unknown',
        organism: data?.rcsb_entity_source_organism?.[0]?.scientific_name || 'Unknown',
        method: data?.exptl?.[0]?.method || 'Unknown',
        resolution: data?.rcsb_entry_info?.resolution_combined?.[0] || 0,
        structure: '',
        sequence: ''
      };
    } catch (error) {
      console.error('Error fetching protein info:', error);
      return null;
    }
  }
}

export const proteinService = new ProteinService();
