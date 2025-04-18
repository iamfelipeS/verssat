import {
  Component,
  ViewChild,
  TemplateRef,
  inject,
  computed,
  OnInit,
  signal
} from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PlayerService } from '../../services/player.service';
import { RatingService } from '../../services/rating.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { Player, PlayerFlag } from '../../models/player.model';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { ToasterService } from '../../services/toaster.service';
import { FlagService } from '../../services/flag.service';

@Component({
  selector: 'app-player-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, LoaderComponent],
  templateUrl: './player-list.component.html',
  styleUrl: './player-list.component.scss',
})
export class PlayerListComponent implements OnInit {
  private playerService = inject(PlayerService);
  private ratingService = inject(RatingService);
  private flagService = inject(FlagService);
  private toaster = inject(ToasterService);

  @ViewChild('modal') modal!: ModalComponent;
  @ViewChild('playerFormTemplate') formTemplateRef!: TemplateRef<any>;

  selectedPlayer: Player | null = null;
  selectedFlagId: number | null = null;

  isLoading = signal(true);
  players = signal<Player[]>([]);
  readonly availableFlags = signal<PlayerFlag[]>([]);

  orderBy = signal<'rating' | 'name' | 'posicao'>('rating');
  
  orderedPlayers = computed(() => {
    const players = [...this.players()];
    const sortBy = this.orderBy();

    return players.sort((a, b) => {
      if (sortBy === 'rating') return this.getRating(b) - this.getRating(a);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'posicao') return a.posicao.localeCompare(b.posicao);
      return 0;
    });
  });

  async ngOnInit() {
    const flags = await this.flagService.getAllFlags();
    this.availableFlags.set(flags);

    this.loadPlayers();
  }

  ngAfterViewInit(): void {
    this.modal.confirmed.subscribe(() => this.savePlayer());
  }

  async loadPlayers() {
    this.isLoading.set(true);
    try {
      this.players.set(await this.playerService.getPlayers());
    } catch (err) {
      this.toaster.error('Erro ao carregar jogadores');
    } finally {
      this.isLoading.set(false);
    }
    console.log(this.players().map(p => ({ name: p.name, flags: p.flags })));

  }

  addPlayer() {
    this.selectedPlayer = {
      id: uuidv4(),
      name: '',
      qualidade: 3,
      velocidade: 6,
      fase: 6,
      movimentacao: 'Normal',
      posicao: 'M',
      rating: 0,
      flags: []
    };
    this.selectedFlagId = null;
  
    this.modal.open({
      title: 'Adicionar Jogador',
      template: this.formTemplateRef,
    });
  }
  
  async editPlayer(player: Player) {
    this.selectedPlayer = { ...player };
  
    const flags = await this.flagService.getFlagsByPlayerId(player.id);
    this.selectedPlayer.flags = flags;
    this.selectedFlagId = flags.length ? flags[0].id : null;
  
    this.modal.open({
      title: 'Editar Jogador',
      template: this.formTemplateRef,
    });
  }
  
  async savePlayer() {
    if (!this.selectedPlayer) return;
  
    this.selectedPlayer.rating = this.getRating(this.selectedPlayer);
  
    try {
      const exists = this.players().some(p => p.id === this.selectedPlayer!.id);
  
      if (exists) {
        await this.playerService.updatePlayer(this.selectedPlayer!);
      } else {
        await this.playerService.addPlayer(this.selectedPlayer!);
      }
  
      // Garante que sempre exista a propriedade flags, mesmo vazia
      this.selectedPlayer.flags = this.selectedPlayer.flags ?? [];
  
      const flagId = this.selectedFlagId;
      await this.flagService.updatePlayerFlags(
        this.selectedPlayer.id,
        flagId ? [flagId] : []
      );
  
      await this.loadPlayers();
  
      this.toaster.success(exists ? 'Jogador atualizado!' : 'Jogador adicionado!');
    } catch (err) {
      this.toaster.error('Erro ao salvar jogador');
    }
  }
  

  async deletePlayer(id: string) {
    if (!confirm('Deseja remover este jogador?')) return;

    try {
      await this.playerService.deletePlayer(id);
      this.toaster.success('Jogador removido!');
      this.players.update(p => p.filter(j => j.id !== id));
    } catch {
      this.toaster.error('Erro ao remover jogador');
    }
  }

  getRating(player: Player): number {
    return this.ratingService.calculate(player);
  }

  getLabelFromQualidade(nivel: number): string {
    switch (nivel) {
      case 1: return 'Ruim';
      case 2: return 'Regular';
      case 3: return 'Normal';
      case 4: return 'Bom';
      case 5: return 'Excelente';
      default: return '';
    }
  }

  getPosicaoLabel(posicao: string): string {
    switch (posicao) {
      case 'G': return 'Goleiro';
      case 'D': return 'Defensor';
      case 'M': return 'Meio Campo';
      case 'A': return 'Atacante';
      default: return '';
    }
  }

  getRatingColor(rating: number): string {
    if (rating <= 55) return 'bg-yellow-900';
    if (rating <= 69) return 'bg-yellow-500';
    if (rating <= 80) return 'bg-green-400';
    return 'bg-green-700';
  }

  getFaseIcon(player: Player): { icon: string; color: string; animation: string } {
    if (player.fase <= 4) {
      return {
        icon: 'fa-caret-down',
        color: 'text-red-500',
        animation: 'animate-bounce-down'
      };
    } else if (player.fase <= 7) {
      return {
        icon: 'fa-minus',
        color: 'text-yellow-400',
        animation: 'animate-pulse'
      };
    } else {
      return {
        icon: 'fa-caret-up',
        color: 'text-green-500',
        animation: 'animate-bounce-up'
      };
    }
  }

  // FLAG

  toggleFlag(flag: PlayerFlag) {
    const current = this.selectedPlayer?.flags ?? [];
    const exists = current.find(f => f.id === flag.id);

    this.selectedPlayer!.flags = exists
      ? current.filter(f => f.id !== flag.id)
      : [...current, flag];
  }

  hasFlag(player: Player, flag: PlayerFlag): boolean {
    return !!player.flags?.some(f => f.id === flag.id);
  }

  async createAndSelectFlag() {
    const name = prompt('Nome da nova flag:');
    if (!name || !name.trim()) return;
  
    try {
      const newFlag = await this.flagService.createFlag(name.trim());
  
      // atualiza lista
      const updated = [...this.availableFlags(), newFlag];
      this.availableFlags.set(updated);
  
      // seta como selecionada
      this.selectedFlagId = newFlag.id;
  
      this.toaster.success('Flag criada com sucesso!');
    } catch {
      this.toaster.error('Erro ao criar flag');
    }
  }

  // AVATAR
  onAvatarChange(event: Event, player: Player) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
  
    this.playerService.updateAvatar(player, file)
      .then(() => this.toaster.success('Avatar atualizado com sucesso!'))
      .catch(() => this.toaster.error('Erro ao atualizar avatar.'));
  }
  
}


