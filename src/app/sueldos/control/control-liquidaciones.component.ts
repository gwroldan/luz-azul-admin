import { Component, OnDestroy, OnInit } from '@angular/core';

import { LocalDataSource } from 'ng2-smart-table';

import { SueldosService } from '../../services/sueldos.service';

@Component({
  selector: 'app-control-liquidaciones',
  templateUrl: './control-liquidaciones.component.html',
  styleUrls: ['./control-liquidaciones.component.scss']
})
export class ControlLiquidacionesComponent implements OnInit, OnDestroy {
  // Properties DataTable
  private columns: Object = {
    empleado:    { title: 'Empleado', editable: false },
    sueldo:      { title: 'Sueldo Neto', editable: false },
    sueldoCpras: { title: 'Sueldo Compras', editable: false },
    difSueldos:  { title: 'Dif. Sueldos', editable: false }
  };
  public settingsTable = {
    attr: { class: 'table' },
    actions: false,
    // hideSubHeader: true,
    noDataMessage: 'Cargando Datos...',
    columns: this.columns,
    pager: { display: true, perPage: 20 }
  };
  public sourceDataTable: LocalDataSource;

  constructor(private sueldosService: SueldosService) {

  }

  public ngOnInit(): void {
    this.sueldosService
      .getControlLiquidaciones(8, 2018)
      .then((sueldos: any[]) => {
        this.sourceDataTable = new LocalDataSource(sueldos);
      });
  }

  public ngOnDestroy() {

  }

}
